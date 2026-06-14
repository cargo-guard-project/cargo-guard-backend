import os

from locust import HttpUser, between, task


TEST_EMAIL = os.getenv("CARGOGUARD_TEST_EMAIL", "operator@test.com")
TEST_PASSWORD = os.getenv("CARGOGUARD_TEST_PASSWORD", "123456")


class CargoGuardUser(HttpUser):
    wait_time = between(1, 3)
    token = None

    def on_start(self):
        with self.client.post(
            "/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
            name="POST /api/auth/login",
            catch_response=True,
        ) as response:
            if response.status_code != 200:
                response.failure(f"Login failed with HTTP {response.status_code}")
                return

            try:
                payload = response.json()
            except ValueError:
                response.failure("Login response is not JSON")
                return

            self.token = (payload.get("data") or {}).get("accessToken")
            if not self.token:
                response.failure("Login response does not contain accessToken")

    @property
    def auth_headers(self):
        return {"Authorization": f"Bearer {self.token}"} if self.token else {}

    @task(3)
    def health(self):
        self.client.get("/health", name="GET /health")

    @task(2)
    def shipments(self):
        self.client.get("/api/shipments", headers=self.auth_headers, name="GET /api/shipments")

    @task(2)
    def cargo(self):
        self.client.get("/api/cargo", headers=self.auth_headers, name="GET /api/cargo")

    @task(2)
    def containers(self):
        self.client.get("/api/containers", headers=self.auth_headers, name="GET /api/containers")

    @task(2)
    def incidents(self):
        self.client.get("/api/incidents", headers=self.auth_headers, name="GET /api/incidents")
