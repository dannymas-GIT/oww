"""Jurisdiction pack registry + public API smoke tests."""

from __future__ import annotations

from app.jurisdictions.registry import all_packs, default_code, get_pack, list_pack_codes, normalize_code
from app.jurisdictions.schema import JurisdictionPack


def test_packs_registered():
    codes = list_pack_codes()
    assert codes == ["CT", "NJ", "NY"]
    for code in codes:
        pack = get_pack(code)
        assert isinstance(pack, JurisdictionPack)
        assert pack.code == code
        assert pack.partner.short
        assert pack.regions
        assert pack.regulators
        assert pack.certification_ladders


def test_nj_single_regulator_both_domains():
    nj = get_pack("NJ")
    assert nj is not None
    assert len(nj.regulators) == 1
    assert "both" in nj.regulators[0].domains
    levels = {c.level for c in nj.certification_ladders}
    assert "T1" in levels and "VSWS" in levels


def test_ct_no_counties_planning_regions():
    ct = get_pack("CT")
    assert ct is not None
    assert ct.geo_unit_label == "Town"
    assert len(ct.regions) == 9
    assert all(r.kind == "planning_region" for r in ct.regions)
    assert not ct.partner.contracted


def test_ny_contracted_with_training():
    ny = get_pack("NY")
    assert ny is not None
    assert ny.partner.contracted
    assert ny.partner.training is not None
    assert ny.map.overlay_url


def test_normalize_and_default():
    assert normalize_code("nj") == "NJ"
    assert normalize_code(None) == default_code()
    assert default_code() in ("NY", "NJ", "CT") or len(default_code()) == 2


def test_all_packs_validate():
    for pack in all_packs():
        tokens = pack.token_map()
        assert "{state_name}" not in tokens["state_name"]
        assert tokens["partner_short"]
