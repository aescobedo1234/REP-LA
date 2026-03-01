import React, { useMemo, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  StatusBar,
} from 'react-native';

const SAMPLE_STOCKS = [
  {
    ticker: 'AAPL',
    company: 'Apple Inc.',
    marketCap: 2.85e12,
    freeCashFlowPerShare: 6.34,
    growthRate: 0.08,
    discountRate: 0.11,
    terminalGrowthRate: 0.025,
  },
  {
    ticker: 'MSFT',
    company: 'Microsoft Corporation',
    marketCap: 3.1e12,
    freeCashFlowPerShare: 12.18,
    growthRate: 0.09,
    discountRate: 0.11,
    terminalGrowthRate: 0.025,
  },
  {
    ticker: 'GOOGL',
    company: 'Alphabet Inc.',
    marketCap: 2.1e12,
    freeCashFlowPerShare: 5.71,
    growthRate: 0.1,
    discountRate: 0.115,
    terminalGrowthRate: 0.03,
  },
  {
    ticker: 'NVDA',
    company: 'NVIDIA Corporation',
    marketCap: 1.9e12,
    freeCashFlowPerShare: 2.02,
    growthRate: 0.15,
    discountRate: 0.12,
    terminalGrowthRate: 0.03,
  },
  {
    ticker: 'AMD',
    company: 'Advanced Micro Devices, Inc.',
    marketCap: 2.9e11,
    freeCashFlowPerShare: 0.94,
    growthRate: 0.11,
    discountRate: 0.125,
    terminalGrowthRate: 0.03,
  },
  {
    ticker: 'ADBE',
    company: 'Adobe Inc.',
    marketCap: 2.5e11,
    freeCashFlowPerShare: 15.34,
    growthRate: 0.08,
    discountRate: 0.105,
    terminalGrowthRate: 0.025,
  },
  {
    ticker: 'META',
    company: 'Meta Platforms, Inc.',
    marketCap: 1.4e12,
    freeCashFlowPerShare: 19.29,
    growthRate: 0.1,
    discountRate: 0.115,
    terminalGrowthRate: 0.03,
  },
  {
    ticker: 'PLTR',
    company: 'Palantir Technologies Inc.',
    marketCap: 5.1e10,
    freeCashFlowPerShare: 0.22,
    growthRate: 0.17,
    discountRate: 0.13,
    terminalGrowthRate: 0.03,
  },
];

const MARKET_CAP_FLOOR = 1e9;

function calculateIntrinsicValue(stock, projectionYears = 5) {
  const {
    freeCashFlowPerShare,
    growthRate,
    discountRate,
    terminalGrowthRate,
  } = stock;

  if (discountRate <= terminalGrowthRate) {
    return null;
  }

  let discountedCashFlows = 0;
  let projectedCashFlow = freeCashFlowPerShare;

  for (let year = 1; year <= projectionYears; year += 1) {
    projectedCashFlow *= 1 + growthRate;
    discountedCashFlows += projectedCashFlow / (1 + discountRate) ** year;
  }

  const terminalCashFlow = projectedCashFlow * (1 + terminalGrowthRate);
  const terminalValue = terminalCashFlow / (discountRate - terminalGrowthRate);
  const discountedTerminalValue =
    terminalValue / (1 + discountRate) ** projectionYears;

  return discountedCashFlows + discountedTerminalValue;
}

function formatCurrency(value) {
  if (value === null || Number.isNaN(value)) {
    return 'N/A';
  }

  return `$${value.toFixed(2)}`;
}

function formatMarketCap(value) {
  if (value >= 1e12) {
    return `$${(value / 1e12).toFixed(2)}T`;
  }

  if (value >= 1e9) {
    return `$${(value / 1e9).toFixed(2)}B`;
  }

  return `$${(value / 1e6).toFixed(2)}M`;
}

export default function App() {
  const [searchText, setSearchText] = useState('');

  const screenedStocks = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    return SAMPLE_STOCKS.filter(
      (stock) =>
        stock.marketCap >= MARKET_CAP_FLOOR &&
        (!query ||
          stock.ticker.toLowerCase().includes(query) ||
          stock.company.toLowerCase().includes(query))
    )
      .map((stock) => ({
        ...stock,
        intrinsicValue: calculateIntrinsicValue(stock),
      }))
      .sort((a, b) => b.marketCap - a.marketCap);
  }, [searchText]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.title}>Intrinsic Value Screener</Text>
        <Text style={styles.subtitle}>iPhone stock screener (market cap {'>'} $1B)</Text>
      </View>

      <View style={styles.searchWrap}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search ticker or company"
          placeholderTextColor="#9BA3B0"
          value={searchText}
          onChangeText={setSearchText}
        />
        <Pressable onPress={() => setSearchText('')} style={styles.clearButton}>
          <Text style={styles.clearButtonText}>Clear</Text>
        </Pressable>
      </View>

      <FlatList
        data={screenedStocks}
        keyExtractor={(item) => item.ticker}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardRowTop}>
              <Text style={styles.ticker}>{item.ticker}</Text>
              <Text style={styles.marketCap}>{formatMarketCap(item.marketCap)}</Text>
            </View>
            <Text style={styles.company}>{item.company}</Text>
            <View style={styles.metricsRow}>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Intrinsic Value / Share</Text>
                <Text style={styles.metricValue}>{formatCurrency(item.intrinsicValue)}</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>FCF / Share</Text>
                <Text style={styles.metricValue}>{formatCurrency(item.freeCashFlowPerShare)}</Text>
              </View>
            </View>
            <Text style={styles.assumptionText}>
              Assumptions: {Math.round(item.growthRate * 100)}% growth, {Math.round(item.discountRate * 100)}% discount,
              {` `}
              {Math.round(item.terminalGrowthRate * 100)}% terminal growth.
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>No matching stocks found.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1421',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  title: {
    color: '#F6F7FB',
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    color: '#9DA8BA',
    marginTop: 6,
    fontSize: 14,
  },
  searchWrap: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 14,
    marginBottom: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#1B2537',
    borderRadius: 12,
    color: '#F6F7FB',
    paddingHorizontal: 12,
    height: 46,
  },
  clearButton: {
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#2C3C57',
  },
  clearButtonText: {
    color: '#DCE3F2',
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#162033',
    borderRadius: 14,
    marginTop: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#24344F',
  },
  cardRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticker: {
    color: '#F6F7FB',
    fontSize: 20,
    fontWeight: '700',
  },
  marketCap: {
    color: '#8FB1FF',
    fontSize: 14,
    fontWeight: '600',
  },
  company: {
    color: '#BAC5D8',
    marginTop: 2,
    fontSize: 14,
  },
  metricsRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 10,
  },
  metricBox: {
    flex: 1,
    backgroundColor: '#1D2A42',
    borderRadius: 12,
    padding: 10,
  },
  metricLabel: {
    color: '#93A4C3',
    fontSize: 12,
  },
  metricValue: {
    marginTop: 4,
    color: '#EBF0FA',
    fontSize: 17,
    fontWeight: '700',
  },
  assumptionText: {
    marginTop: 10,
    color: '#8D9CB7',
    fontSize: 12,
    lineHeight: 18,
  },
  emptyWrap: {
    marginTop: 30,
    alignItems: 'center',
  },
  emptyText: {
    color: '#9DA8BA',
    fontSize: 14,
  },
});
