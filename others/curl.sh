curl -X POST -H "Content-Type: application/json" -d '{
  "setting_type":"call_to_actions",
  "thread_state":"new_thread",
  "call_to_actions":[
    {
      "payload":"first_hi"
    }
  ]
}' "https://graph.facebook.com/v2.6/me/thread_settings?access_token=EAARB3MkmntIBAGgt84LStqnget7IzPZBOnNWsBBmbr9OL1RCeRF5MLrouci7Eso2f0S6s3oqrxsJxHu34DMjGANG0q0JzUbjr33ApSIMmab5CwtcIwu0B0itnZCgLSiwcT76eOgVL4vN4guYS74VCsXvIJQeC4mtNdnI81tgZDZD"      


