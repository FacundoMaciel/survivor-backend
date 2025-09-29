import request from "supertest";
import app from "../server";

describe("Survivor API", () => {
  it("GET /api/survivor/ debe devolver array", async () => {
    const res = await request(app).get("/api/survivor/");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("POST /api/survivor/join/:id falla con id inválido", async () => {
    const res = await request(app)
      .post("/api/survivor/join/invalidid")
      .send({ userId: "user123" });

    expect([400, 404]).toContain(res.status);
  });

  it("POST /api/survivor/predict/:id devuelve error si no existe survivor", async () => {
    const res = await request(app)
      .post("/api/survivor/predict/invalidid")
      .send({ userId: "user123", predictions: [] });

    expect([400, 404]).toContain(res.status);
  });
});
