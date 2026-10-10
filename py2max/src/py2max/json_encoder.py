import json
from typing import Any

class MaxJSONEncoder:
    """Encoder that produces Max/MSP-style JSON formatting."""

    def __init__(self):
        self.indent_str = "\t"
        self.line_endings = "\r\n"

    def encode(self, obj: Any) -> str:
        """Encode a Python object to Max-style JSON string."""
        return self._encode_value(obj, 0)

    def _encode_value(self, obj: Any, level: int) -> str:
        """Encode a value at a specific indentation level."""
        if obj is None:
            return "null"
        elif isinstance(obj, bool):
            return "true" if obj else "false"
        elif isinstance(obj, int):
            return str(obj)
        elif isinstance(obj, float):
            # up to 15 decimal places, remove trailing zeros except for one zero after decimal point
            # example: 1.230000000000000 -> 1.23
            # example: 1.000000000000000 -> 1.0,
            s15 = f"{obj:.15f}"
            s = s15.rstrip('0')
            if s.endswith("."):
                s += "0"
            return s
        elif isinstance(obj, str):
            return json.dumps(obj)  # Use standard JSON string escaping
        elif isinstance(obj, list):
            return self._encode_array(obj, level)
        elif isinstance(obj, dict):
            return self._encode_object(obj, level)
        else:
            raise TypeError(f"Object of type {type(obj).__name__} is not JSON serializable")

    def _encode_array(self, arr: list, level: int) -> str:
        """Encode an array with Max-style formatting."""
        if not arr:
            return "[ ]"

        # Check if it's a simple array (all primitives)
        is_simple = all(isinstance(item, (int, float, str, bool, type(None))) for item in arr)

        if is_simple:
            # Simple array on one line
            items = [self._encode_value(item, level) for item in arr]
            return "[ " + ", ".join(items) + " ]"
        else:
            # Complex array with line breaks
            indent = self.indent_str * (level + 1)
            items = []
            for item in arr:
                encoded = self._encode_value(item, level + 1)
                items.append(encoded)

            result = "[ " + indent + items[0] + self.line_endings
            for item in items[1:]:
                result += ", " + indent + item + self.line_endings
            result += " ]"
            return result

    def _encode_object(self, obj: dict, level: int) -> str:
        """Encode an object with Max-style formatting."""
        if not obj:
            return "{" + 2 * self.line_endings + self.indent_str * level + "}"

        indent = self.indent_str * (level + 1)
        lines = []

        sort_needed = False
        maxclass = obj.get("maxclass")
        if isinstance(maxclass, str):
            sort_needed = maxclass in ["live.dial", "message", "toggle", "newobj"]

        # sort_needed = "classnamespace" not in obj.keys()

        items: list
        if sort_needed:
            items = list({key: obj[key] for key in sorted(obj)}.items())
        else:
            items = list(obj.items())

        for i, (key, value) in enumerate(items):
            encoded_value = self._encode_value(value, level + 1)
            key_str = json.dumps(key)
            is_last = (i == len(items) - 1)

            # Max format uses: "key" : \t\t\t{...} for objects (tabs match indentation level)
            # For other values: "key" : value
            if isinstance(value, dict):
                # Number of tabs after : should match indentation level (level + 1)
                tabs_after_colon = self.indent_str * (level + 1)
                line = f'{indent}{key_str} : {tabs_after_colon}{encoded_value}'
            else:
                line = f'{indent}{key_str} : {encoded_value}'

            # For objects (not arrays) that are not last, add }\r\n,\r\n pattern
            if isinstance(value, dict) and not is_last:
                lines.append(line + self.line_endings + ",")
            else:
                lines.append(line + ("," if not is_last else ""))

        result = "{" + self.line_endings
        for line in lines:
            result += line + self.line_endings

        # Add empty line before closing brace if last item is an object
        if items and isinstance(items[-1][1], dict):
            result += self.line_endings

        result += self.indent_str * level + "}"
        return result
