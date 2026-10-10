"""Jurisdiction pack registry + activation policy tests."""

from __future__ import annotations

from app.jurisdictions.registry import all_packs, default_code, get_pack, list_pack_codes, normalize_code
from app.jurisdictions.schema import JurisdictionPack


def test_packs_registered():
    codes = list_pack_codes()
    assert codes == ["CT", "NE", "NJ", "NY"]
    for code in codes:
        pack = get_pack(code)
        assert isinstance(pack, JurisdictionPack)
        assert pack.code == code
        assert pack.partner.short
        assert pack.regions or pack.kind == "region"


def test_only_ny_public_by_default():
    for pack in all_packs():
        if pack.code == "NY":
            assert pack.partner.contracted
            assert pack.should_activate_public
        else:
            assert not pack.should_activate_public
            assert pack.default_active is False


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


def test_ne_region_tenant():
    ne = get_pack("NE")
    assert ne is not None
    assert ne.kind == "region"
    assert set(ne.member_state_codes) == {"CT", "MA", "ME", "NH", "RI", "VT"}
    assert len(ne.regions) == 6
    assert not ne.certification_ladders  # member states own certs
    assert not ne.should_activate_public


def test_ny_contracted_with_training():
    ny = get_pack("NY")
    assert ny is not None
    assert ny.partner.contracted
    assert ny.partner.training is not None
    assert ny.map.overlay_url


def test_normalize_and_default():
    assert normalize_code("nj") == "NJ"
    assert normalize_code(None) == default_code()
    assert default_code() == "NY"


def test_all_packs_validate():
    for pack in all_packs():
        tokens = pack.token_map()
        assert tokens["partner_short"]
        assert tokens["state_name"]
