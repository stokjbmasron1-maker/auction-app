import React, { createContext, useContext, useState, useEffect } from 'react';

interface CurrencyInfo {
  code: string;
  rate: number;
  symbol: string;
}

interface CurrencyContextType {
  currencyInfo: CurrencyInfo;
  formatPrice: (amountInIdr: number) => string;
  loading: boolean;
}

const defaultInfo: CurrencyInfo = { code: 'IDR', rate: 1, symbol: 'Rp' };

const CurrencyContext = createContext<CurrencyContextType>({
  currencyInfo: defaultInfo,
  formatPrice: (amount) => `Rp ${amount.toLocaleString('id-ID')}`,
  loading: true
});

export const useCurrency = () => useContext(CurrencyContext);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currencyInfo, setCurrencyInfo] = useState<CurrencyInfo>(defaultInfo);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const detectCurrency = async () => {
      try {
        const geoRes = await fetch('https://ipapi.co/json/');
        const geoData = await geoRes.json();
        
        if (geoData.country_code !== 'ID') {
          // If not in Indonesia, fetch exchange rate and convert to USD
          try {
            const rateRes = await fetch('https://open.er-api.com/v6/latest/IDR');
            const rateData = await rateRes.json();
            const usdRate = rateData.rates.USD || 0.000062; // fallback 1 USD = 16000 IDR
            setCurrencyInfo({ code: 'USD', rate: usdRate, symbol: '$' });
          } catch (e) {
            setCurrencyInfo({ code: 'USD', rate: 0.000062, symbol: '$' });
          }
        } else {
          setCurrencyInfo(defaultInfo);
        }
      } catch (e) {
        console.error("Geoloc/Currency detection failed", e);
        setCurrencyInfo(defaultInfo);
      } finally {
        setLoading(false);
      }
    };

    detectCurrency();
  }, []);

  const formatPrice = (amountInIdr: number) => {
    if (currencyInfo.code === 'IDR') {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amountInIdr);
    } else {
      const converted = amountInIdr * currencyInfo.rate;
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(converted);
    }
  };

  return (
    <CurrencyContext.Provider value={{ currencyInfo, formatPrice, loading }}>
      {children}
    </CurrencyContext.Provider>
  );
};
