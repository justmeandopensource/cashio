from decimal import Decimal
from typing import Annotated

from pydantic import PlainSerializer

# Decimal type that serializes as float in JSON responses (not string)
JsonDecimal = Annotated[Decimal, PlainSerializer(lambda v: float(v), return_type=float, when_used="json")]
