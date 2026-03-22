import { useId, useMemo } from "react";
import { listTimeZones } from "../../utils/profileFields";
import { StyledInput } from "../auth/authStyles";

/**
 * Searchable IANA timezone field (native datalist).
 */
export default function TimeZoneInput({
  value,
  onChange,
  disabled,
  placeholder = "Search or type IANA zone",
  name = "timezone",
}) {
  const reactId = useId();
  const listId = `nudge-tz-${reactId.replace(/:/g, "")}`;
  const zones = useMemo(() => listTimeZones(), []);

  return (
    <>
      <datalist id={listId}>
        {zones.map((z) => (
          <option key={z} value={z} />
        ))}
      </datalist>
      <StyledInput
        name={name}
        list={listId}
        autoComplete="off"
        value={value}
        onChange={(ev) => onChange(ev.target.value)}
        placeholder={placeholder}
        disabled={disabled}
      />
    </>
  );
}
