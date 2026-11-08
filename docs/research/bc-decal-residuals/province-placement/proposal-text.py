"""Normalize human-readable research prose without touching identifiers/URLs."""
import re

FIELDS={'findings','scope','alignment','uncertainty','measurementBasis','stage','decision','remaining','evidenceLimit'}

def normalize(value,key=None):
    if isinstance(value,dict):return {k:normalize(v,k)for k,v in value.items()}
    if isinstance(value,list):return [normalize(v,key)for v in value]
    if isinstance(value,str)and key in FIELDS:
        value=re.sub(r'(?<=[a-zA-Z])(?=\d)', ' ', value)
        value=re.sub(r'(?<=\d)(?=[a-zA-Z])', ' ', value)
        return value
    return value
