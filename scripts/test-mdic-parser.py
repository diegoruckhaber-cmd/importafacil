#!/usr/bin/env python3
import importlib.util
import unittest

spec = importlib.util.spec_from_file_location("mdic", "scripts/sync-mdic-defesa-comercial.py")
mdic = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mdic)

def page(origin, content):
    return mdic.parse_page(mdic.INDEX_URL + "/fixture", f"""<h1>Fixture</h1>
    <p>Tipo de Medida: Direito Antidumping Definitivo</p><p>NCM: 9602.00.10</p>
    <p>Países de origem: {origin}</p><p>Direito Aplicado:</p>{content}
    <p>Prazo de vigência: 10/05/2028</p>""")

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

if __name__ == "__main__":
    unittest.main()
