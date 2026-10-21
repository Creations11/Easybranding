import { useState } from 'react';
import { colors } from '../../utils/theme';
import { useDeliveryManage, useShopCategories } from '../../hooks/useDeliveryManage';
import { useRun } from './useRun';
import { act } from './helpers';
import { Card, Empty, Said } from './ui';
import ShopForm from './ShopForm';
import ShopCard from './ShopCard';

function AddShop({ q, categories }) {
  const { addShop } = useDeliveryManage(q);
  const { busy, result, run, clear } = useRun();
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <div style={{ marginBottom: '12px' }}>
        <button onClick={() => { clear(); setOpen(true); }} style={act(colors.lime, false)}>+ Add shop</button>
        <Said result={result} />
      </div>
    );
  }
  const submit = async (f) => {
    const data = await run(
      () => addShop({
        name: f.name.trim(), category: f.category, phone: f.phone.trim(), contactName: f.contactName.trim() || null,
        deliveryOnly: f.deliveryOnly, commissionPct: f.deliveryOnly ? 0 : Number(f.commissionPct || 0),
      }),
      (d) => `${d.shop.name} is added, switched off until you approve it.\n\nSend the shop this link. It takes them through setting up: ${d.joinLink}\nJoin code: ${d.shop.joinCode}`,
    );
    if (data) setOpen(false);
  };
  return (
    <Card>
      <div style={{ color: colors.text, fontWeight: 600, fontSize: '14px' }}>Add a shop</div>
      <ShopForm submitLabel="Add shop" onSubmit={submit} onCancel={() => setOpen(false)} busy={busy} categories={categories} />
      <Said result={result} />
    </Card>
  );
}

export default function Businesses({ businesses, q }) {
  const categories = useShopCategories().data;
  return (
    <div>
      <AddShop q={q} categories={categories} />
      {!businesses.length && <Empty>No shops yet. Add one above, or invite one from WhatsApp with ADDSHOP.</Empty>}
      {businesses.map((v) => <ShopCard key={v.id} v={v} q={q} categories={categories} />)}
    </div>
  );
}
