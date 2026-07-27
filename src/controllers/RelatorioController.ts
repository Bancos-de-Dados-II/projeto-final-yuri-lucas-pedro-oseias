import { Request, Response } from "express";
import { pdfReportService } from "../services/pdfReportService.ts";

export class RelatorioController {
  // GET /relatorios/beneficiarios/pdf - Download de PDF com relatório de beneficiários e famílias
  async getBeneficiariosPdf(req: Request, res: Response) {
    try {
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="relatorio_beneficiarios_geopb_${Date.now()}.pdf"`);
      await pdfReportService.generateBeneficiariosPdfReport(res);
    } catch (error) {
      console.error("Erro ao gerar PDF de beneficiários:", error);
      if (!res.headersSent) {
        return res.status(500).json({ error: "Erro interno ao gerar relatório em PDF." });
      }
    }
  }

  // GET /relatorios/visitas/pdf - Download de PDF com relatório de visitas domiciliares
  async getVisitasPdf(req: Request, res: Response) {
    try {
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="relatorio_visitas_geopb_${Date.now()}.pdf"`);
      await pdfReportService.generateVisitasPdfReport(res);
    } catch (error) {
      console.error("Erro ao gerar PDF de visitas:", error);
      if (!res.headersSent) {
        return res.status(500).json({ error: "Erro interno ao gerar relatório em PDF." });
      }
    }
  }

  // GET /relatorios/visita/:id/pdf - Download de PDF com dossiê individual da visita
  async getVisitaIndividualPdf(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID de visita inválido." });
      }

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="dossie_visita_${id}_geopb.pdf"`);
      const success = await pdfReportService.generateVisitaIndividualPdfReport(id, res);

      if (!success && !res.headersSent) {
        return res.status(404).json({ error: "Visita não encontrada." });
      }
    } catch (error) {
      console.error(`Erro ao gerar PDF da visita #${req.params.id}:`, error);
      if (!res.headersSent) {
        return res.status(500).json({ error: "Erro interno ao gerar PDF da visita." });
      }
    }
  }
}

export const relatorioController = new RelatorioController();
