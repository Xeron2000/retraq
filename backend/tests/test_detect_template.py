import os

import pytest

from services.trade_importer import detect_template

SAMPLE = os.path.join(os.path.dirname(__file__), "..", "..", "samples", "bit-langge-delivery-example.xlsx")


@pytest.mark.skipif(not os.path.isfile(SAMPLE), reason="sample xlsx missing")
def test_detect_langge_sample():
    assert detect_template(SAMPLE) == "langge"