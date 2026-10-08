"""OWW model registry."""

from app.db.base_class import Base  # noqa: F401


def import_models() -> None:
    import app.models.user  # noqa: F401
    import app.models.jurisdiction  # noqa: F401
    import app.models.otp_code  # noqa: F401
    import app.models.engagement_event  # noqa: F401
    import app.models.individual_profile  # noqa: F401
    import app.models.organization  # noqa: F401
    import app.models.org_member  # noqa: F401
    import app.models.job  # noqa: F401
    import app.models.job_template  # noqa: F401
    import app.models.application  # noqa: F401
    import app.models.match  # noqa: F401
    import app.models.favorite  # noqa: F401
    import app.models.interest_submission  # noqa: F401
    import app.models.program_submission  # noqa: F401
    import app.models.content_page  # noqa: F401
    import app.models.media_asset  # noqa: F401
    import app.models.resource_item  # noqa: F401
    import app.models.testimonial  # noqa: F401
    import app.models.microvideo  # noqa: F401
    import app.models.course  # noqa: F401
    import app.models.event  # noqa: F401
    import app.models.registration  # noqa: F401
    import app.models.message  # noqa: F401
    import app.models.message_template  # noqa: F401
    import app.models.note  # noqa: F401
    import app.models.interview  # noqa: F401
    import app.models.featured_post  # noqa: F401
    import app.models.credit  # noqa: F401
    import app.models.order  # noqa: F401
    import app.models.certification_catalog  # noqa: F401
    import app.models.location  # noqa: F401
    import app.models.membership  # noqa: F401
    import app.models.communication  # noqa: F401
    import app.models.impersonation  # noqa: F401
    import app.models.login_event  # noqa: F401
    import app.models.platform_setting  # noqa: F401
    import app.models.utility_registration  # noqa: F401
