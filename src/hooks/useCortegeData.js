import { useState, useEffect, useRef, useCallback } from 'react';
import { apiUrl, wsUrl } from '../lib/backend-url.js';
import { useHouseholdContext } from '../context/HouseholdContext.jsx';

/**
 * Custom hook that manages all CORTEGE data:
 * - Fetches household + companions from REST API on mount
 * - Connects WebSocket and merges real-time updates
 * - Re-fetches on WebSocket reconnect
 * - Re-fetches when household selection changes
 */
export function useCortegeData() {
  const { currentHouseholdId, memberVersion, householdVersion } = useHouseholdContext();
  const [household, setHousehold] = useState(null);
  const [companions, setCompanions] = useState([]);
  const [liveEvents, setLiveEvents] = useState([]);
  const [wsConnected, setWsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [processingStates, setProcessingStates] = useState(new Map());
  const [captchaSessions, setCaptchaSessions] = useState([]);
  const [brokerStatusVersion, setBrokerStatusVersion] = useState(0);

  const wsRef = useRef(null);
  const reconnectTimer = useRef(null);
  const hasFetched = useRef(false);

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Use household-specific endpoint when a household is selected
      const hhEndpoint = currentHouseholdId
        ? `/api/households/${currentHouseholdId}`
        : '/api/household';

      const companionsEndpoint = currentHouseholdId
        ? `/api/companions?household_id=${encodeURIComponent(currentHouseholdId)}`
        : '/api/companions';

      const [hhRes, compRes] = await Promise.all([
        fetch(apiUrl(hhEndpoint)),
        fetch(apiUrl(companionsEndpoint)),
      ]);

      if (hhRes.ok) {
        const hhData = await hhRes.json();
        setHousehold(hhData);
      }

      if (compRes.ok) {
        const compData = await compRes.json();
        setCompanions(Array.isArray(compData) ? compData : []);
      }
      hasFetched.current = true;
    } catch (err) {
      setError('Cannot reach backend');
      console.warn('[useCortegeData] Fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  }, [currentHouseholdId]);

  const connectWs = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState < 2) return;

    const socket = new WebSocket(wsUrl('/ws'));
    wsRef.current = socket;

    socket.onopen = () => {
      setWsConnected(true);
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
        reconnectTimer.current = null;
      }
      // Re-fetch on reconnect to sync state (skip if initial fetch already succeeded)
      if (hasFetched.current) fetchData();
    };

    socket.onmessage = (e) => {
      let msg;
      try { msg = JSON.parse(e.data); } catch { return; }
      const { event, data } = msg;

      if (event === 'event:received') {
        setLiveEvents(prev => [data, ...prev].slice(0, 50));
      } else if (event === 'escalation:fired') {
        const level = data?.level ?? data?.escalation_level ?? '';
        const member = data?.member_id ?? data?.target_member ?? '';
        showToast(`Escalation L${level} — ${member}`);
      } else if (event === 'stage:transition') {
        setCompanions(prev => prev.map(c =>
          c.id === data?.instanceId
            ? { ...c, stage: data.toStage ?? c.stage, depthScore: data.depthScore ?? c.depthScore }
            : c
        ));
      } else if (event === 'agent:processing') {
        setProcessingStates(prev => {
          const next = new Map(prev);
          next.set(data?.instanceId, true);
          return next;
        });
      } else if (event === 'agent:response') {
        setProcessingStates(prev => {
          const next = new Map(prev);
          next.set(data?.instanceId, false);
          return next;
        });
        if (data?.instanceId) {
          setCompanions(prev => prev.map(c =>
            c.id === data.instanceId
              ? {
                  ...c,
                  eventsProcessed: (c.eventsProcessed ?? 0) + 1,
                  lastAction: {
                    text: data.response?.assessment ?? 'Event processed',
                    timestamp: new Date().toISOString(),
                    threatLevel: data.response?.threat_level ?? 0,
                  },
                }
              : c
          ));
        }
      } else if (event === 'agent:error') {
        setProcessingStates(prev => {
          const next = new Map(prev);
          next.set(data?.instanceId, false);
          return next;
        });
      } else if (event === 'companion:status') {
        setCompanions(prev => {
          const idx = prev.findIndex(c => c.id === data?.instanceId || c.id === data?.id);
          if (idx === -1) return [...prev, data];
          const next = [...prev];
          next[idx] = { ...next[idx], ...data };
          return next;
        });
      // WARDEN events
      } else if (event === 'warden:captcha_required') {
        setCaptchaSessions(prev => {
          // Deduplicate by sessionId
          const filtered = prev.filter(s => s.sessionId !== data.sessionId);
          return [...filtered, data];
        });
        showToast(`CAPTCHA needed: ${data.brokerName ?? data.brokerId}`);
      } else if (event === 'warden:captcha_expired' || event === 'warden:captcha_resolved') {
        setCaptchaSessions(prev => prev.filter(s => s.sessionId !== data.sessionId));
      } else if (event === 'warden:status_update' || event === 'warden:scan_complete') {
        // Bump version so BrokerStatus re-fetches
        setBrokerStatusVersion(v => v + 1);
      }
    };

    socket.onclose = () => {
      setWsConnected(false);
      reconnectTimer.current = setTimeout(connectWs, 3000);
    };

    socket.onerror = () => {
      setWsConnected(false);
      socket.close();
    };
  }, [fetchData, showToast]);

  useEffect(() => {
    connectWs();
    fetchData();
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (wsRef.current) wsRef.current.close();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-fetch when household selection or member data changes
  useEffect(() => {
    if (hasFetched.current) {
      fetchData();
    }
  }, [currentHouseholdId, memberVersion, householdVersion, fetchData]);

  return {
    household,
    companions,
    liveEvents,
    wsConnected,
    loading,
    error,
    toast,
    processingStates,
    captchaSessions,
    brokerStatusVersion,
    refetch: fetchData,
  };
}
