/**
 * StockStatus - "Sold out" / "Only 3 left" line under a price.
 * Shows nothing for normal stock to keep the cards quiet.
 */
import { useLanguage } from '../../i18n/LanguageContext';

export default function StockStatus({ product, showInStock = false, className = '' }) {
  const { t } = useLanguage();

  if (!product.inStock) {
    return <p className={`text-sm font-medium text-red-700 ${className}`}>{t('shop.product.outOfStock')}</p>;
  }
  if (product.lowStock) {
    return (
      <p className={`text-sm font-medium text-gold-700 ${className}`}>
        {t('shop.product.lowStock', { count: product.stock })}
      </p>
    );
  }
  return showInStock ? (
    <p className={`text-sm text-emerald-700 ${className}`}>{t('shop.product.inStock')}</p>
  ) : null;
}
