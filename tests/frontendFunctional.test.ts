import { describe, it, expect } from "@jest/globals";
import request from "supertest";
import fs from "fs";
import path from "path";
import { app } from "../src/app.ts";

describe("Testes Funcionais das Telas Principais da Interface (Frontend)", () => {

  const frontendPages = [
    { name: "Tela de Login", file: "login.html", route: "/login.html" },
    { name: "Dashboard Principal", file: "dashboard.html", route: "/dashboard.html" },
    { name: "Gestão de Beneficiários", file: "beneficiarios.html", route: "/beneficiarios.html" },
    { name: "Gestão de Famílias", file: "familias.html", route: "/familias.html" },
    { name: "Registro de Visitas Domiciliares", file: "visitas.html", route: "/visitas.html" },
    { name: "Mapa Interativo da Paraíba", file: "mapa.html", route: "/mapa.html" },
    { name: "Geração de Relatórios em PDF (RF15)", file: "relatorios.html", route: "/relatorios.html" },
    { name: "Programas Sociais", file: "programas.html", route: "/programas.html" },
    { name: "Agendamentos", file: "agendamentos.html", route: "/agendamentos.html" },
    { name: "Gerenciamento de Usuários", file: "usuarios.html", route: "/usuarios.html" },
  ];

  frontendPages.forEach((page) => {
    it(`deve servir a ${page.name} (${page.file}) com status 200 OK`, async () => {
      const response = await request(app).get(page.route);
      expect(response.status).toBe(200);
      expect(response.headers["content-type"]).toContain("text/html");
    });
  });

  describe("Validação de Elementos e Componentes Específicos nas Telas", () => {

    it("deve conter campos e formulário no Login (login.html)", () => {
      const html = fs.readFileSync(path.resolve("frontend", "login.html"), "utf-8");
      expect(html).toContain('id="email"');
      expect(html).toContain('id="password"');
      expect(html).toContain('id="loginForm"');
    });

    it("deve conter canvas de mapa e cards de estatísticas no Dashboard (dashboard.html)", () => {
      const html = fs.readFileSync(path.resolve("frontend", "dashboard.html"), "utf-8");
      expect(html).toContain('leaflet');
      expect(html).toContain('stat-card');
    });

    it("deve conter tabela e filtro de busca na Gestão de Beneficiários (beneficiarios.html)", () => {
      const html = fs.readFileSync(path.resolve("frontend", "beneficiarios.html"), "utf-8");
      expect(html).toContain('<table');
      expect(html).toContain('id="searchInput"');
      expect(html).toContain('id="statTotalBeneficiarios"');
    });

    it("deve conter mapa Leaflet e seletores de métricas no Mapa da PB (mapa.html)", () => {
      const html = fs.readFileSync(path.resolve("frontend", "mapa.html"), "utf-8");
      expect(html).toContain('id="mapaCanvas"');
      expect(html).toContain('metric-btn');
    });

    it("deve conter botões de exportação de relatórios em PDF (relatorios.html)", () => {
      const html = fs.readFileSync(path.resolve("frontend", "relatorios.html"), "utf-8");
      expect(html).toContain('id="btnDownloadBeneficiarios"');
      expect(html).toContain('id="btnDownloadVisitas"');
    });
  });
});
