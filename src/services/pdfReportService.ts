import PDFDocument from "pdfkit";
import { Beneficiario, Familia, Visita, Usuario } from "../models/index.ts";

export class PdfReportService {
  // RF15: Relatório 1 - Relatório Geral de Beneficiários e Famílias em PDF
  async generateBeneficiariosPdfReport(resStream: any): Promise<void> {
    const doc = new PDFDocument({ margin: 40, size: "A4" });

    doc.pipe(resStream);

    // Cabeçalho Institucional
    this.addHeader(doc, "RELATÓRIO GERAL DE BENEFICIÁRIOS E FAMÍLIAS");

    const beneficiarios = await Beneficiario.findAll({
      include: [{ model: Familia, as: "familia" }],
      order: [["id", "ASC"]],
    });

    doc.fontSize(10).fillColor("#555555").text(`Total de beneficiários cadastrados: ${beneficiarios.length}`, { paragraphGap: 10 });

    // Tabela de Dados
    const tableTop = 150;
    doc.font("Helvetica-Bold").fontSize(9).fillColor("#1C3742");
    doc.text("ID", 40, tableTop);
    doc.text("Nome Beneficiário", 70, tableTop);
    doc.text("CPF", 200, tableTop);
    doc.text("Situação Social", 290, tableTop);
    doc.text("Responsável Familiar", 390, tableTop);
    doc.text("Coordenadas GPS", 490, tableTop);

    doc.moveTo(40, tableTop + 14).lineTo(560, tableTop + 14).strokeColor("#BC5B3B").lineWidth(1.5).stroke();

    let y = tableTop + 22;
    doc.font("Helvetica").fontSize(8).fillColor("#333333");

    beneficiarios.forEach((b, index) => {
      if (y > 750) {
        doc.addPage();
        this.addHeader(doc, "RELATÓRIO GERAL DE BENEFICIÁRIOS E FAMÍLIAS (Cont.)");
        y = 120;
      }

      const fam = (b as any).familia;
      const coords = fam ? `${Number(fam.latitude).toFixed(4)}, ${Number(fam.longitude).toFixed(4)}` : "N/I";

      doc.text(String(b.id), 40, y);
      doc.text(b.nome.substring(0, 24), 70, y);
      doc.text(b.cpf, 200, y);
      doc.text(b.situacaoSocial || "Não informada", 290, y);
      doc.text(fam ? fam.nomeResponsavel.substring(0, 18) : "Sem vínculo", 390, y);
      doc.text(coords, 490, y);

      y += 18;

      // Linha separadora sutil
      if (index % 2 === 0) {
        doc.moveTo(40, y - 4).lineTo(560, y - 4).strokeColor("#EEEEEE").lineWidth(0.5).stroke();
      }
    });

    this.addFooter(doc);
    doc.end();
  }

  // RF15: Relatório 2 - Relatório Geral de Visitas Domiciliares em PDF
  async generateVisitasPdfReport(resStream: any): Promise<void> {
    const doc = new PDFDocument({ margin: 40, size: "A4" });

    doc.pipe(resStream);

    this.addHeader(doc, "RELATÓRIO DE VISITAS DOMICILIARES E ATENDIMENTOS");

    const visitas = await Visita.findAll({
      include: [
        { model: Beneficiario, as: "beneficiario" },
        { model: Usuario, as: "usuario" },
      ],
      order: [["dataVisita", "DESC"]],
    });

    doc.fontSize(10).fillColor("#555555").text(`Total de visitas domiciliares registradas: ${visitas.length}`, { paragraphGap: 10 });

    const tableTop = 150;
    doc.font("Helvetica-Bold").fontSize(9).fillColor("#1C3742");
    doc.text("Data", 40, tableTop);
    doc.text("Beneficiário Atendido", 110, tableTop);
    doc.text("Assistente Social", 240, tableTop);
    doc.text("Ações Realizadas", 360, tableTop);
    doc.text("Geolocalização GPS", 470, tableTop);

    doc.moveTo(40, tableTop + 14).lineTo(560, tableTop + 14).strokeColor("#BC5B3B").lineWidth(1.5).stroke();

    let y = tableTop + 22;
    doc.font("Helvetica").fontSize(8).fillColor("#333333");

    visitas.forEach((v) => {
      if (y > 740) {
        doc.addPage();
        this.addHeader(doc, "RELATÓRIO DE VISITAS DOMICILIARES (Cont.)");
        y = 120;
      }

      const benName = (v as any).beneficiario?.nome || `ID #${v.beneficiarioId}`;
      const usuName = (v as any).usuario?.nome || `ID #${v.usuarioId}`;
      const dataFmt = new Date(v.dataVisita).toLocaleDateString("pt-BR");
      const coords = `${Number(v.latitude).toFixed(4)}, ${Number(v.longitude).toFixed(4)}`;

      doc.text(dataFmt, 40, y);
      doc.text(benName.substring(0, 22), 110, y);
      doc.text(usuName.substring(0, 18), 240, y);
      doc.text((v.acoesRealizadas || "Atendimento padrão").substring(0, 22), 360, y);
      doc.text(coords, 470, y);

      y += 20;
    });

    this.addFooter(doc);
    doc.end();
  }

  // RF15: Relatório 3 - Dossiê de Atendimento Individual em PDF
  async generateVisitaIndividualPdfReport(visitaId: number, resStream: any): Promise<boolean> {
    const visita = await Visita.findByPk(visitaId, {
      include: [
        { model: Beneficiario, as: "beneficiario", include: [{ model: Familia, as: "familia" }] },
        { model: Usuario, as: "usuario" },
      ],
    });

    if (!visita) return false;

    const doc = new PDFDocument({ margin: 40, size: "A4" });
    doc.pipe(resStream);

    this.addHeader(doc, `DOSSIÊ DE ATENDIMENTO DOMICILIAR #${visita.id}`);

    const ben = (visita as any).beneficiario;
    const fam = ben?.familia;
    const usu = (visita as any).usuario;

    let y = 140;

    // Seção Beneficiário
    doc.font("Helvetica-Bold").fontSize(12).fillColor("#1C3742").text("DADOS DO BENEFICIÁRIO E FAMÍLIA", 40, y);
    doc.moveTo(40, y + 16).lineTo(560, y + 16).strokeColor("#BC5B3B").lineWidth(1).stroke();
    y += 26;

    doc.font("Helvetica-Bold").fontSize(9).fillColor("#333333");
    doc.text("Nome Completo:", 40, y); doc.font("Helvetica").text(ben?.nome || "N/I", 140, y);
    y += 16;
    doc.font("Helvetica-Bold").text("CPF:", 40, y); doc.font("Helvetica").text(ben?.cpf || "N/I", 140, y);
    y += 16;
    doc.font("Helvetica-Bold").text("Situação Social:", 40, y); doc.font("Helvetica").text(ben?.situacaoSocial || "N/I", 140, y);
    y += 16;
    doc.font("Helvetica-Bold").text("Responsável Familiar:", 40, y); doc.font("Helvetica").text(fam?.nomeResponsavel || "N/I", 140, y);
    y += 16;
    doc.font("Helvetica-Bold").text("Endereço:", 40, y); doc.font("Helvetica").text(fam?.endereco || "N/I", 140, y);
    y += 28;

    // Seção Detalhes da Visita
    doc.font("Helvetica-Bold").fontSize(12).fillColor("#1C3742").text("DETALHES DA VISITA DOMICILIAR", 40, y);
    doc.moveTo(40, y + 16).lineTo(560, y + 16).strokeColor("#BC5B3B").lineWidth(1).stroke();
    y += 26;

    doc.font("Helvetica-Bold").fontSize(9).fillColor("#333333");
    doc.text("Data da Visita:", 40, y); doc.font("Helvetica").text(new Date(visita.dataVisita).toLocaleString("pt-BR"), 140, y);
    y += 16;
    doc.font("Helvetica-Bold").text("Assistente Social:", 40, y); doc.font("Helvetica").text(usu ? `${usu.nome} (${usu.email})` : "N/I", 140, y);
    y += 16;
    doc.font("Helvetica-Bold").text("Coordenadas GPS:", 40, y); doc.font("Helvetica").text(`Lat: ${visita.latitude}, Lng: ${visita.longitude}`, 140, y);
    y += 24;

    doc.font("Helvetica-Bold").text("Ações Realizadas:", 40, y); y += 14;
    doc.font("Helvetica").fontSize(9).text(visita.acoesRealizadas || "Nenhuma ação descrita.", 40, y, { width: 500 });
    y += 40;

    doc.font("Helvetica-Bold").text("Observações do Atendimento:", 40, y); y += 14;
    doc.font("Helvetica").fontSize(9).text(visita.observacoes || "Sem observações registradas.", 40, y, { width: 500 });
    y += 50;

    // Assinaturas
    doc.moveTo(60, y + 40).lineTo(250, y + 40).strokeColor("#666666").lineWidth(0.8).stroke();
    doc.fontSize(8).fillColor("#666").text("Assinatura do Assistente Social", 75, y + 45);

    doc.moveTo(330, y + 40).lineTo(520, y + 40).strokeColor("#666666").lineWidth(0.8).stroke();
    doc.fontSize(8).fillColor("#666").text("Assinatura do Beneficiário", 360, y + 45);

    this.addFooter(doc);
    doc.end();
    return true;
  }

  private addHeader(doc: PDFKit.PDFDocument, title: string) {
    doc.rect(0, 0, 600, 80).fill("#1C3742");
    doc.font("Helvetica-Bold").fontSize(16).fillColor("#FFFFFF").text("GEOPB COMUNIDADES", 40, 22);
    doc.font("Helvetica").fontSize(10).fillColor("#E9C9B4").text("Sistema de Assistência Social e Georreferenciamento da Paraíba", 40, 42);
    doc.font("Helvetica-Bold").fontSize(12).fillColor("#1C3742").text(title, 40, 100);
    doc.fontSize(8).fillColor("#666666").text(`Emitido em: ${new Date().toLocaleString("pt-BR")}`, 40, 118, { align: "right" });
  }

  private addFooter(doc: PDFKit.PDFDocument) {
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      doc.fontSize(8).fillColor("#888888").text(
        `GeoPB Comunidades · Documento Oficial Gerado em PDF (RF15) · Página ${i + 1} de ${pages.count}`,
        40,
        800,
        { align: "center" }
      );
    }
  }
}

export const pdfReportService = new PdfReportService();
