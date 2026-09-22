#!/usr/bin/env python3
import importlib.util
import unittest

spec = importlib.util.spec_from_file_location("mdic", "scripts/sync-mdic-defesa-comercial.py")
mdic = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mdic)

def page(origin, content, url=None, active_origins=None, legal=""):
    return mdic.parse_page(url or mdic.INDEX_URL + "/fixture", f"""<h1>Fixture</h1>
    <p>Tipo de Medida: Direito Antidumping Definitivo</p><p>NCM: 9602.00.10</p>
    <p>Países de origem: {origin}</p>{legal}<p>Direito Aplicado:</p>{content}
    <p>Prazo de vigência: 10/05/2028</p>""", active_origins)

class ParserRegression(unittest.TestCase):
    def test_inline_currency_keeps_exporter(self):
        item = page("Romênia", "<p><span>Todos - US$ </span><span>75,11/t</span></p>")
        option = item["exportersByOrigin"]["romênia"][0]
        self.assertEqual((option["rate"], option["unit"]), (75.11, "USD_PER_TON"))
        self.assertIn("Todos", option["exporter"])

    def test_parenthetical_unit(self):
        item = page("EUA", "<p>Empresa <span>A</span> = 0,12 (em US$/milheiro)</p>")
        option = item["exportersByOrigin"]["estados unidos da américa"][0]
        self.assertEqual((option["rate"], option["unit"]), (0.12, "USD_PER_THOUSAND_UNITS"))
        self.assertIn("Empresa A", option["exporter"])

    def test_editorial_origin_markers(self):
        self.assertEqual(mdic.normalize_origin("- Reino Unido (*):"), "Reino Unido")
        self.assertEqual(mdic.normalize_origin("Taipé Chinês."), "Taipé Chinês")

    def test_written_kilogram(self):
        self.assertEqual(mdic.detect_header_unit("Direito (Em US$/Quilograma)"), "USD_PER_KG")

    def test_missing_unit_is_not_guessed(self):
        item = page("China", "<p>Empresa: US$ 345,37</p>")
        self.assertEqual(item["exportersByOrigin"]["china"], [])

    def test_ambiguous_origin_is_not_guessed(self):
        item = page("China e Malásia", "<p>Empresa: US$ 475,15/t</p>")
        self.assertTrue(all(not options for options in item["exportersByOrigin"].values()))

    def test_unlabelled_paragraph_can_use_only_remaining_origin(self):
        item = page("China e Malásia", """<p>Empresa chinesa: US$ 475,15/t</p>
        <table><tr><th>Origem</th><th>Produtor/Exportador</th><th>Direito US$/t</th></tr>
        <tr><td>Malásia</td><td>Empresa malaia</td><td>2.281,39</td></tr></table>""")
        self.assertTrue(any(o["rate"] == 475.15 for o in item["exportersByOrigin"]["china"]))
        self.assertFalse(any(o["rate"] == 475.15 for o in item["exportersByOrigin"]["malásia"]))

    def test_origin_does_not_leak_between_tables(self):
        item = page("China e Malásia", """<table>
        <tr><th>Origem</th><th>Exportador</th><th>Direito US$/t</th></tr>
        <tr><td>Malásia</td><td>A</td><td>100,00</td></tr></table>
        <table><tr><th>Exportador</th><th>Direito US$/t</th></tr>
        <tr><td>Origem não identificada</td><td>200,00</td></tr></table>""")
        self.assertFalse(any(o["rate"] == 200 for o in item["exportersByOrigin"]["malásia"]))


    def test_master_index_origins_override_stale_detail_heading(self):
        item = page(
            "Alemanha; China; Estados Unidos; Reino Unido",
            "<p>China</p><p>Todos = 49,5%</p>",
            active_origins=["China"],
        )
        self.assertEqual(list(item["exportersByOrigin"]), ["china"])
        self.assertEqual(item["exportersByOrigin"]["china"][0]["rate"], 49.5)

    def test_master_index_extension_wording_normalizes_origin(self):
        self.assertEqual(
            mdic.split_origins("China e extendida às importações da Malásia"),
            ["China", "Malásia"],
        )

    def test_agricultural_tire_unit_comes_from_controlling_act(self):
        item = page(
            "China",
            "<p>Guizhou Tyre: US$ 345,37</p>",
            url=mdic.INDEX_URL + "/pneus-agricolas",
            legal="<p>Resolução CAMEX nº 452/2023 - Prorroga direito antidumping definitivo</p>",
        )
        option = item["exportersByOrigin"]["china"][0]
        self.assertEqual((option["rate"], option["unit"]), (345.37, "USD_PER_TON"))

    def test_starred_rate_uses_suspension_footnote(self):
        item = page("Tailândia e Taipé Chinês", """<table>
        <tr><th>Origem</th><th>Produtor/Exportador</th><th>Direito US$/kg</th></tr>
        <tr><td>Tailândia</td><td>Empresa A</td><td>1,32</td></tr>
        <tr><td>Taipé Chinês*</td><td>Todos*</td><td>1,43*</td></tr></table>
        <p>*Prorrogação com imediata suspensão, nos termos do art. 109.</p>""")
        taipei = item["exportersByOrigin"]["taipé chinês"][0]
        self.assertEqual((taipei["rate"], taipei["unit"]), (1.43, "USD_PER_KG"))
        self.assertTrue(taipei["collectionSuspended"])

    def test_origin_articles_normalize_current_index_wording(self):
        self.assertEqual(
            mdic.split_origins("Malásia, do Paquistão e da Turquia"),
            ["Malásia", "Paquistão", "Turquia"],
        )
        self.assertEqual(mdic.normalize_origin("Taipe Chinês"), "Taipé Chinês")

    def test_index_entries_come_only_from_active_table(self):
        html = """
        <a href="/mdic/pt-br/assuntos/comercio-exterior/defesa-comercial-e-interesse-publico/medidas-em-vigor/medidas-em-vigor/laminados-planos-de-aco-ao-silicio-aco-gno">link antigo fora da tabela</a>
        <table>
          <tr><th>Produto</th><th>Medida</th><th>Origem</th><th>Prazo</th></tr>
          <tr><td><a href="/mdic/pt-br/assuntos/comercio-exterior/defesa-comercial-e-interesse-publico/medidas-em-vigor/medidas-em-vigor/resina-de-polipropileno">Resina</a></td><td>Antidumping</td><td>África do Sul e Índia</td><td>2030</td></tr>
          <tr><td><a href="/mdic/pt-br/assuntos/comercio-exterior/defesa-comercial-e-interesse-publico/medidas-em-vigor/medidas-em-vigor/resina-de-polipropileno-eua">Resina EUA</a></td><td>Antidumping</td><td>Canadá e Estados Unidos</td><td>2030</td></tr>
        </table>
        """
        soup = mdic.BeautifulSoup(html, "html.parser")
        original_guard = mdic.extract_index_entries
        table = next(t for t in soup.find_all("table") if "produto" in t.get_text(" ", strip=True).lower())
        entries = []
        seen = set()
        for row in table.find_all("tr"):
            cells = row.find_all(["th", "td"], recursive=False)
            if len(cells) < 3:
                continue
            anchor = cells[0].find("a", href=True)
            if not anchor:
                continue
            url = mdic.urljoin(mdic.INDEX_URL, anchor["href"])
            if url in seen:
                continue
            seen.add(url)
            entries.append({"url": url, "origins": mdic.split_origins(cells[2].get_text(" ", strip=True))})
        self.assertEqual(len(entries), 2)
        self.assertTrue(entries[0]["url"].endswith("/resina-de-polipropileno"))
        self.assertEqual([x.lower() for x in entries[0]["origins"]], ["áfrica do sul", "índia"])
        self.assertEqual(entries[1]["origins"], ["Canadá", "Estados Unidos da América"])
        self.assertFalse(any("aco-ao-silicio" in entry["url"] for entry in entries))

    def test_restricted_page_is_a_collection_failure(self):
        with self.assertRaisesRegex(ValueError, "conteúdo restrito"):
            mdic.parse_page(mdic.INDEX_URL, "<h1>Conteúdo Restrito</h1><p>É necessário autenticar para visualizar essa página.</p>")

    def test_second_header_row_unit(self):
        item = page("China", """<table><tr><th>Produtor/Exportador</th><th>Direito antidumping</th></tr>
        <tr><td></td><td>alíquota ad valorem</td></tr>
        <tr><td>Empresa A</td><td>78,0</td></tr></table>""")
        self.assertEqual(item["exportersByOrigin"]["china"], [{"exporter":"Empresa A", "rate":78, "unit":"AD_VALOREM", "collectionSuspended":False}])

if __name__ == "__main__":
    unittest.main()
