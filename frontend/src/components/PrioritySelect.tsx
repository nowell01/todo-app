import { PRIORITY_LABELS, type Priority } from "../api";

interface Props {
  value: Priority;
  onChange: (value: Priority) => void;
}

export default function PrioritySelect({ value, onChange }: Props) {
  return (
    <select value={value} onChange={(e) => onChange(Number(e.target.value) as Priority)}>
      {([1, 2, 3] as const).map((p) => (
        <option key={p} value={p}>
          {PRIORITY_LABELS[p]}
        </option>
      ))}
    </select>
  );
}