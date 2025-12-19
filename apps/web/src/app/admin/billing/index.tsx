import BillingPage from './page';
import BillingCheckout from './checkout';
import BillingCancel from './cancel';

export default function BillingIndex() {
  return (
    <div>
      <BillingPage />
      <BillingCheckout />
      <BillingCancel />
    </div>
  );
}
