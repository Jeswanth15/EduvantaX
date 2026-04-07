import urllib.request, json

def test(url, method='POST', data=None):
    print(f"\n--- Testing {url} ---")
    headers = {'Content-Type': 'application/json'}
    req = urllib.request.Request(url, method=method, data=data, headers=headers)
    try:
        response = urllib.request.urlopen(req)
        print("SUCCESS:", response.read().decode())
    except urllib.error.HTTPError as e:
        print("ERROR CODE:", e.code)
        try:
            print("ERROR BODY:", e.read().decode())
        except Exception:
            pass
    except Exception as e:
        print("ERROR:", e)

test('http://localhost:8080/transport/admin/create-bus?busNumber=TN99%20TEST&capacity=50')
test('http://localhost:8080/transport/admin/assign-bus/1/route/3')
test('http://localhost:8080/transport/admin/assign-driver', data=b'{"driverId": 1, "busId": 1}')
