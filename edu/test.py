import urllib.request, json
data = json.dumps({"name": "Driver", "email": "driver3@test.com", "password": "pwd", "role": "DRIVER", "schoolId": 1}).encode()
req = urllib.request.Request('http://localhost:8080/api/users/register', method='POST', data=data, headers={'Content-Type': 'application/json'})
try:
    print("SUCCESS: ", urllib.request.urlopen(req).read().decode())
except Exception as e:
    print("ERROR: ", e)
    if hasattr(e, 'read'):
        print(e.read().decode())
