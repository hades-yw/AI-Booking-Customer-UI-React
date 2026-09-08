import { Pill } from "../../components/ui/Pill";

interface CategoryFilterProps {
  categories: string[];
  active: string;
  onChange: (category: string) => void;
}

export function CategoryFilter({ categories, active, onChange }: CategoryFilterProps) {
  return (
    <div className="overflow-x-auto pb-1 pt-3">
      <div className="mx-auto flex w-max max-w-[1600px] gap-2 px-4 md:w-full md:flex-wrap md:px-8 lg:px-12">
        {categories.map((cat) => (
          <Pill key={cat} active={active === cat} onClick={() => onChange(cat)}>
            {cat}
          </Pill>
        ))}
      </div>
    </div>
  );
}
