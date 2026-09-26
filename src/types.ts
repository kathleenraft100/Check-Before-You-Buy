export type TabType = 'check' | 'history' | 'you';

export interface EvaluationItem {
  id: string;
  title: string;
  price: string;
  source: string;
  date: string;
  verdict: 'recommended' | 'caution' | 'neutral';
  verdictLabel: string;
  summary: string;
  highlights: {
    priceFairness: string;
    returnPolicy: string;
    sellerTrust: string;
    impulseAdvice: string;
  };
}
