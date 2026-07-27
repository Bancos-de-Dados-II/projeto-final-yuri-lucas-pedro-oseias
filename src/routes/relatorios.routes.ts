import { Router } from "express";
import { relatorioController } from "../controllers/RelatorioController.ts";
import { authMiddleware } from "../middlewares/authMiddleware.ts";

const relatoriosRouter = Router();

// RF15: Geração de Relatórios em PDF
relatoriosRouter.get("/beneficiarios/pdf", authMiddleware, (req, res) => relatorioController.getBeneficiariosPdf(req, res));
relatoriosRouter.get("/visitas/pdf", authMiddleware, (req, res) => relatorioController.getVisitasPdf(req, res));
relatoriosRouter.get("/visita/:id/pdf", authMiddleware, (req, res) => relatorioController.getVisitaIndividualPdf(req, res));

export { relatoriosRouter };
