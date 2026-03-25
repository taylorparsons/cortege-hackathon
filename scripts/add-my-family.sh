#!/bin/bash
# Quick script to add your family via API
# Edit the values below, then run: bash scripts/add-my-family.sh

API="http://localhost:3001/api"

echo "Creating location..."
LOCATION_ID=$(curl -s -X POST $API/locations \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Home",
    "address": {
      "line1": "123 Your Street",
      "city": "Your City",
      "region": "CA",
      "postal_code": "94102",
      "country": "US"
    }
  }' | jq -r '.location_id')

echo "Location ID: $LOCATION_ID"

echo "Creating household..."
HOUSEHOLD_ID=$(curl -s -X POST $API/households \
  -H 'Content-Type: application/json' \
  -d "{
    \"name\": \"My Family\",
    \"location_id\": \"$LOCATION_ID\"
  }" | jq -r '.household_id')

echo "Household ID: $HOUSEHOLD_ID"

echo "Adding family members..."

# Add yourself (adult with Sentinel companion)
curl -s -X POST $API/households/$HOUSEHOLD_ID/members \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Taylor",
    "phone": "+14155551234",
    "date_of_birth": "1990-01-15",
    "profile_type": "adult",
    "companion": "sentinel",
    "is_primary": true
  }' | jq '.'

# Add your mom (elderly with Anchor companion)
curl -s -X POST $API/households/$HOUSEHOLD_ID/members \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Mom",
    "phone": "+14155555678",
    "date_of_birth": "1960-05-20",
    "profile_type": "elderly",
    "companion": "anchor"
  }' | jq '.'

# Add your kid (teen with Scout companion)
curl -s -X POST $API/households/$HOUSEHOLD_ID/members \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Alex",
    "phone": "+14155559012",
    "date_of_birth": "2010-08-10",
    "profile_type": "teen",
    "companion": "scout"
  }' | jq '.'

echo ""
echo "✅ Done! Your household ID is: $HOUSEHOLD_ID"
echo "Open http://localhost:5173 and click 'Switch Household' to select it"
