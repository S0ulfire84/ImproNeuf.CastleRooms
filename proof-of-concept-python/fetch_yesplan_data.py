#!/usr/bin/env python3
"""
YesPlan API Proof of Concept Script

This script demonstrates how to fetch data from YesPlan using their REST API.
It fetches various types of data including events, resources, and contacts.
"""

import requests
import json
import os
from typing import Optional, Dict, Any


# YesPlan API Configuration
YESPLAN_BASE_URL = "https://neuf.yesplan.be"
# API key should be set via environment variable: YESPLAN_API_KEY
API_KEY = os.getenv('YESPLAN_API_KEY')
if not API_KEY:
    raise ValueError('YESPLAN_API_KEY environment variable is required')


def fetch_yesplan_data(endpoint: str, params: Optional[Dict[str, Any]] = None) -> Optional[Dict[str, Any]]:
    """
    Fetch data from YesPlan API.
    
    Args:
        endpoint: API endpoint (e.g., 'events', 'resources', 'contacts')
        params: Optional query parameters (api_key will be added automatically)
        
    Returns:
        JSON response data or None if request fails
    """
    url = f"{YESPLAN_BASE_URL}/api/{endpoint}"
    
    # Prepare query parameters - always include api_key
    query_params = {"api_key": API_KEY}
    if params:
        query_params.update(params)
    
    headers = {
        'Accept': 'application/json',
    }
    
    try:
        response = requests.get(url, headers=headers, params=query_params, timeout=30)
        
        if response.status_code == 200:
            return response.json()
        elif response.status_code == 401:
            print(f"❌ Authentication failed. Please check your API key.")
            print(f"Response: {response.text}")
            return None
        elif response.status_code == 404:
            print(f"❌ Endpoint not found: {endpoint}")
            return None
        else:
            print(f"❌ Error {response.status_code}: {response.text}")
            return None
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Request error: {e}")
        return None


def print_json_pretty(data: Dict[str, Any], limit: int = 5):
    """
    Print JSON data in a readable format, limiting the number of items shown.
    
    Args:
        data: JSON data to print (can be a dict with 'data' key or a list)
        limit: Maximum number of items to show if data is a list
    """
    # Handle YesPlan API response structure (has 'data' and 'pagination' keys)
    if isinstance(data, dict) and 'data' in data:
        items = data['data']
        pagination = data.get('pagination', {})
        
        if isinstance(items, list):
            print(f"\nFound {len(items)} items in response")
            if pagination:
                print(f"Pagination: {json.dumps(pagination, indent=2, ensure_ascii=False)}")
            print(f"Showing first {min(limit, len(items))}:\n")
            for i, item in enumerate(items[:limit]):
                print(f"--- Item {i+1} ---")
                print(json.dumps(item, indent=2, ensure_ascii=False))
                print()
        else:
            print(json.dumps(data, indent=2, ensure_ascii=False))
    elif isinstance(data, list):
        print(f"\nFound {len(data)} items. Showing first {min(limit, len(data))}:\n")
        for i, item in enumerate(data[:limit]):
            print(f"--- Item {i+1} ---")
            print(json.dumps(item, indent=2, ensure_ascii=False))
            print()
    else:
        print(json.dumps(data, indent=2, ensure_ascii=False))


def main():
    """Main function to demonstrate fetching various data types from YesPlan."""
    
    print("=" * 60)
    print("YesPlan API Proof of Concept")
    print("=" * 60)
    print(f"Base URL: {YESPLAN_BASE_URL}")
    print(f"API Key: {'*' * 8}...{'*' * 8} (hidden)")
    print("=" * 60)
    
    # List of endpoints to try
    endpoints = [
        "events",
        "resources",
        "contacts",
        "locations",
        "labels"
    ]
    
    results = {}
    
    for endpoint in endpoints:
        print(f"\n🔍 Fetching {endpoint}...")
        data = fetch_yesplan_data(endpoint)
        
        if data:
            print(f"✅ Successfully fetched {endpoint}")
            results[endpoint] = data
            
            # Print a preview of the data
            print_json_pretty(data, limit=3)
        else:
            print(f"⚠️  Failed to fetch {endpoint}")
            results[endpoint] = None
    
    # Summary
    print("\n" + "=" * 60)
    print("Summary")
    print("=" * 60)
    for endpoint, data in results.items():
        if data:
            # Handle YesPlan API response structure
            if isinstance(data, dict) and 'data' in data:
                item_count = len(data['data']) if isinstance(data['data'], list) else 1
                print(f"✅ {endpoint}: {item_count} items")
            elif isinstance(data, list):
                print(f"✅ {endpoint}: {len(data)} items")
            else:
                print(f"✅ {endpoint}: Retrieved")
        else:
            print(f"❌ {endpoint}: Failed")
    
    # Save results to a JSON file
    output_file = "yesplan_data.json"
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
        print(f"\n💾 Results saved to {output_file}")
    except Exception as e:
        print(f"\n⚠️  Could not save results to file: {e}")


if __name__ == "__main__":
    main()

