/**
 * FilterSidebar - multi-criteria catalog filters: type, origin, cacao %, price, stock.
 *
 * It only shows the filters and reports changes with onChange({ ...changedFilters });
 * CatalogPage keeps the values in the URL and loads the matching products.
 * The numbers next to each option come from the API ("facets") and show how many
 * products you would get if you picked that option.
 */
import { useCallback, useId } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { formatPrice } from '../../utils/format';
import RangeSlider from './RangeSlider';

const CHECK =
  'h-4 w-4 shrink-0 accent-cocoa-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cocoa-900';

function Section({ title, children }) {
  return (
    <fieldset className="border-t border-cocoa-200 pt-5">
      <legend className="float-left mb-3 w-full text-sm font-semibold text-cocoa-900">{title}</legend>
      <div className="clear-left">{children}</div>
    </fieldset>
  );
}

function Count({ value }) {
  return <span className="ml-auto text-xs tabular-nums text-cocoa-600">{value}</span>;
}

export default function FilterSidebar({ filters, facets, onChange, onClearAll, hasActiveFilters }) {
  const { lang, t } = useLanguage();
  const radioGroup = useId(); // unique name: the sidebar is shown in two places (desktop + mobile)

  const pctBounds = facets.cacaoPct;
  const priceBounds = facets.price;

  // A handle pushed all the way to the end means "no limit" (null), so the URL stays short
  const handleCacao = useCallback(
    ([low, high]) =>
      onChange({
        minPct: low <= pctBounds.min ? null : low,
        maxPct: high >= pctBounds.max ? null : high,
      }),
    [onChange, pctBounds.min, pctBounds.max]
  );
  const handlePrice = useCallback(
    ([low, high]) =>
      onChange({
        minPrice: low <= priceBounds.min ? null : low,
        maxPrice: high >= priceBounds.max ? null : high,
      }),
    [onChange, priceBounds.min, priceBounds.max]
  );

  function toggleOrigin(origin) {
    const origins = filters.origins.includes(origin)
      ? filters.origins.filter((o) => o !== origin)
      : [...filters.origins, origin];
    onChange({ origins });
  }

  const formatWhole = (amount) => formatPrice(amount, lang).replace(/\.00$/, '');

  return (
    <div className="space-y-5">
      {/* Type */}
      <Section title={t('shop.catalog.category')}>
        <div className="space-y-2">
          {[{ value: '', count: null }, ...facets.categories].map(({ value, count }) => (
            <label key={value || 'all'} className="flex cursor-pointer items-center gap-3 text-sm text-cocoa-800">
              <input
                type="radio"
                name={radioGroup}
                className={CHECK}
                checked={filters.category === value}
                onChange={() => onChange({ category: value })}
              />
              {value ? t(`shop.catalog.categories.${value}`) : t('shop.catalog.allCategories')}
              {count !== null && <Count value={count} />}
            </label>
          ))}
        </div>
      </Section>

      {/* Origin */}
      <Section title={t('shop.catalog.origin')}>
        <div className="space-y-2">
          {facets.origins.map(({ value, count }) => {
            const checked = filters.origins.includes(value);
            const disabled = count === 0 && !checked;
            return (
              <label
                key={value}
                className={`flex items-center gap-3 text-sm ${disabled ? 'text-cocoa-400' : 'cursor-pointer text-cocoa-800'}`}
              >
                <input
                  type="checkbox"
                  className={CHECK}
                  checked={checked}
                  disabled={disabled}
                  onChange={() => toggleOrigin(value)}
                />
                {value}
                <Count value={count} />
              </label>
            );
          })}
        </div>
      </Section>

      {/* Cacao % */}
      <div className="border-t border-cocoa-200 pt-5">
        <RangeSlider
          legend={t('shop.catalog.cacao')}
          min={pctBounds.min}
          max={pctBounds.max}
          value={[filters.minPct ?? pctBounds.min, filters.maxPct ?? pctBounds.max]}
          onChange={handleCacao}
          format={(v) => `${v}%`}
          minLabel={t('shop.catalog.minCacao')}
          maxLabel={t('shop.catalog.maxCacao')}
        />
      </div>

      {/* Price */}
      <div className="border-t border-cocoa-200 pt-5">
        <RangeSlider
          legend={t('shop.catalog.price')}
          min={priceBounds.min}
          max={priceBounds.max}
          value={[filters.minPrice ?? priceBounds.min, filters.maxPrice ?? priceBounds.max]}
          onChange={handlePrice}
          format={formatWhole}
          minLabel={t('shop.catalog.minPrice')}
          maxLabel={t('shop.catalog.maxPrice')}
        />
      </div>

      {/* Stock */}
      <div className="border-t border-cocoa-200 pt-5">
        <label className="flex cursor-pointer items-center gap-3 text-sm text-cocoa-800">
          <input
            type="checkbox"
            className={CHECK}
            checked={filters.inStock}
            onChange={(event) => onChange({ inStock: event.target.checked })}
          />
          {t('shop.catalog.inStock')}
        </label>
      </div>

      {hasActiveFilters && (
        <button
          type="button"
          onClick={onClearAll}
          className="w-full rounded-full border border-cocoa-300 px-4 py-2 text-sm font-semibold text-cocoa-800 hover:bg-cocoa-100"
        >
          {t('shop.catalog.clearAll')}
        </button>
      )}
    </div>
  );
}
