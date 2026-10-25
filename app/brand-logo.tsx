export function BrandLogo({ symbol = false }: { symbol?: boolean }) {
  return (
    <img
      className={symbol ? "ditto-symbol" : "ditto-logo"}
      src={symbol ? "/brand/official/symbol.webp" : "/brand/official/logo-horizontal.webp"}
      alt="Ditto"
      width={symbol ? 96 : 420}
      height={symbol ? 64 : 140}
      draggable={false}
    />
  );
}
