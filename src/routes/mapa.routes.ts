import { Router } from "express";
import { mapaController } from "../controllers/MapaController.ts";
import { authMiddleware } from "../middlewares/authMiddleware.ts";

const mapaRouter = Router();

// Rota para obter o GeoJSON dos municípios da PB (com suporte a cache no Redis TTL 24h)
mapaRouter.get("/geojson", authMiddleware, (req, res) => mapaController.getGeoJson(req, res));

// Rota auxiliar para invalidar cache do Redis se necessário
mapaRouter.delete("/cache", authMiddleware, (req, res) => mapaController.invalidateCache(req, res));

export { mapaRouter };
