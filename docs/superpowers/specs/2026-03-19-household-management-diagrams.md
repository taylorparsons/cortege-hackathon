# Multi-Household Management — System Diagrams

Companion diagrams for the [Household Management Design Spec](2026-03-19-household-management-design.md).

## 1. Storage Architecture

```mermaid
graph TB
    subgraph Legacy["Legacy Storage"]
        LF["data/household.json\nsingle household"]
    end

    subgraph MultiHousehold["Multi-Household Storage"]
        DIR["data/households/"]
        H1["<uuid-1>.json\nFamily A"]
        H2["<uuid-2>.json\nFamily B"]
        H3["<uuid-N>.json\n..."]
    end

    subgraph HouseholdStore["HouseholdStore Class"]
        CREATE["createHousehold()"]
        LIST["listHouseholds()"]
        GET["getHousehold()"]
        UPDATE["updateHousehold()"]
        DELETE["deleteHousehold()"]
        ADD_M["addMember()"]
        UPDATE_M["updateMember()"]
        REMOVE_M["removeMember()"]
    end

    subgraph Schema["Household JSON Schema"]
        HID["household_id: uuid"]
        NAME["name: string"]
        LOC["location: string"]
        MEMBERS["members: Member[]"]
        CREATED["created_at: ISO 8601"]
        UPDATED["updated_at: ISO 8601"]
    end

    subgraph MemberSchema["Member Schema"]
        MID["id: uuid"]
        MNAME["name: string"]
        MAGE["age: number"]
        MPROFILE["profileType: string"]
        MCOMP["companion: string"]
    end

    CREATE --> DIR
    LIST --> DIR
    GET --> H1
    GET --> H2
    UPDATE --> H1
    DELETE --> H1
    ADD_M --> H1
    UPDATE_M --> H1
    REMOVE_M --> H1

    DIR --> H1
    DIR --> H2
    DIR --> H3

    H1 --> Schema
    Schema --> MEMBERS
    MEMBERS --> MemberSchema
```

## 2. Backward Compatibility Fallback Chain

```mermaid
sequenceDiagram
    participant Client as Client
    participant API as GET /api/household
    participant HS as HouseholdStore
    participant ENV as process.env
    participant FS as data/household.json
    participant DEF as Default Response

    Client->>API: GET /api/household

    alt orchestrator.householdStore exists
        API->>ENV: Check DEFAULT_HOUSEHOLD_ID
        alt DEFAULT_HOUSEHOLD_ID set
            ENV-->>API: household-uuid
            API->>HS: getHousehold(uuid)
            alt household found
                HS-->>API: household data
                API-->>Client: 200 OK (from store by ID)
            else household not found
                HS-->>API: error
                Note over API: Fall through to list
            end
        end

        API->>HS: listHouseholds()
        alt households exist
            HS-->>API: [household1, ...]
            API->>HS: getHousehold(first.id)
            HS-->>API: household data
            API-->>Client: 200 OK (first household)
        else no households
            Note over API: Fall through to legacy
        end
    end

    alt household.json exists
        API->>FS: readFileSync()
        FS-->>API: legacy data
        API-->>Client: 200 OK (from legacy file)
    else no legacy file
        API->>DEF: { name, members: [] }
        DEF-->>API: empty default
        API-->>Client: 200 OK (empty default)
    end
```

## 3. API Endpoint Map

```mermaid
graph LR
    subgraph HouseholdAPI["Household CRUD"]
        POST_H["POST /api/households\nCreate household"]
        GET_ALL["GET /api/households\nList all"]
        GET_ONE["GET /api/households/:id\nGet by ID"]
        PUT_H["PUT /api/households/:id\nUpdate"]
        DEL_H["DELETE /api/households/:id\nDelete"]
    end

    subgraph MemberAPI["Member Management"]
        POST_M["POST /api/households/:id/members\nAdd member"]
        PUT_M["PUT /api/households/:id/members/:mid\nUpdate member"]
        DEL_M["DELETE /api/households/:id/members/:mid\nRemove member"]
    end

    subgraph LegacyAPI["Legacy Endpoint"]
        GET_L["GET /api/household\nBackward compat fallback"]
    end

    subgraph Store["HouseholdStore"]
        HS["server/storage/\nhousehold-store.js"]
    end

    POST_H --> HS
    GET_ALL --> HS
    GET_ONE --> HS
    PUT_H --> HS
    DEL_H --> HS
    POST_M --> HS
    PUT_M --> HS
    DEL_M --> HS
    GET_L -->|"fallback chain"| HS
```

## 4. Frontend Component Architecture

```mermaid
graph TB
    subgraph App["Application Root"]
        MAIN["main.jsx"]
    end

    subgraph Providers["Context Providers"]
        HP["HouseholdProvider\nHouseholdContext.jsx"]
    end

    subgraph MainUI["Main UI"]
        CORTEGE["Cortege.jsx"]
        NAV["Nav Bar\n'Switch Household' button"]
    end

    subgraph Modal["Household Selector Modal"]
        HS_COMP["HouseholdSelector.jsx"]
        HS_LIST["Household List\nselect / delete"]
        HS_CREATE["Create Form\nname + location"]
    end

    subgraph Hooks["Custom Hooks"]
        USE_HH["useHouseholds\nfetch / create / delete"]
        USE_CTX["useHouseholdContext\ncurrentHouseholdId"]
        USE_DATA["useCortegeData\nhousehold-scoped fetch"]
    end

    subgraph State["State Management"]
        CTX["React Context\ncurrentHouseholdId"]
        LS["localStorage\ncortege-household-id"]
    end

    subgraph API["Backend API"]
        REST["/api/households\n/api/households/:id"]
    end

    MAIN --> HP
    HP --> CORTEGE
    CORTEGE --> NAV
    NAV -->|"onClick"| HS_COMP
    HS_COMP --> HS_LIST
    HS_COMP --> HS_CREATE

    HS_COMP --> USE_HH
    CORTEGE --> USE_CTX
    CORTEGE --> USE_DATA

    USE_HH --> REST
    USE_DATA -->|"fetches scoped data"| REST
    USE_CTX --> CTX
    CTX <-->|"persist / restore"| LS

    HS_LIST -->|"setCurrentHouseholdId"| CTX
    CTX -->|"triggers re-fetch"| USE_DATA
```

## 5. Household Switching Data Flow

```mermaid
sequenceDiagram
    participant User as User
    participant Nav as Nav Bar
    participant Modal as HouseholdSelector
    participant Hook as useHouseholds
    participant Ctx as HouseholdContext
    participant LS as localStorage
    participant Data as useCortegeData
    participant API as Backend API

    User->>Nav: Click "Switch Household"
    Nav->>Modal: showHouseholdSelector = true

    Modal->>Hook: fetchHouseholds()
    Hook->>API: GET /api/households
    API-->>Hook: [{id, name, location}, ...]
    Hook-->>Modal: render household list

    User->>Modal: Select "Family B"
    Modal->>Ctx: setCurrentHouseholdId(family-b-uuid)
    Ctx->>LS: store("cortege-household-id", uuid)
    Modal->>Nav: onClose()

    Note over Ctx,Data: Context change triggers useEffect

    Data->>API: GET /api/households/family-b-uuid
    API-->>Data: { name, members, ... }
    Data-->>Nav: Re-render with Family B data
```

## 6. Migration Flow

```mermaid
sequenceDiagram
    participant User as User
    participant Script as migrate-household.js
    participant Legacy as data/household.json
    participant Backup as data/household.json.backup
    participant Store as HouseholdStore
    participant Dir as data/households/

    User->>Script: node scripts/migrate-household.js

    Script->>Legacy: readFileSync()
    Legacy-->>Script: { name, members[] }

    Script->>Backup: copyFileSync()
    Note over Backup: Original preserved

    Script->>Store: new HouseholdStore('data/households')
    Script->>Store: createHousehold({ name, location })
    Store->>Dir: Write <uuid>.json

    loop For each member
        Script->>Store: addMember(householdId, member)
        Store->>Dir: Update <uuid>.json
    end

    Store-->>Script: Complete
    Script-->>User: Migrated N members to household <uuid>
```

## 7. Orchestrator Integration

```mermaid
graph TB
    subgraph ServerStartup["server/index.js"]
        INIT["new Orchestrator({\n  enableHouseholdStore: true\n})"]
    end

    subgraph Orchestrator["orchestrator.js — start()"]
        CHECK{"enableHouseholdStore?"}
        CREATE_HS["this.householdStore =\nnew HouseholdStore(\n  'data/households'\n)"]
        SKIP["householdStore = null"]
        EXISTING["Existing startup:\nevent bus, factory,\nscheduler, etc."]
    end

    subgraph Routes["server/api/routes.js"]
        CRUD["Household CRUD routes\nuse orchestrator.householdStore"]
        LEGACY["GET /api/household\nchecks orchestrator.householdStore"]
    end

    INIT --> CHECK
    CHECK -->|true| CREATE_HS
    CHECK -->|false| SKIP
    CREATE_HS --> EXISTING
    SKIP --> EXISTING

    CREATE_HS -.-> CRUD
    CREATE_HS -.-> LEGACY
```
