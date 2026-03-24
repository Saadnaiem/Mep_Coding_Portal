INSERT INTO item_master (
    erp_item_code,
    item_description,
    division,
    department,
    category,
    sub_category,
    class_name,
    brand,
    status
)
SELECT 
    COALESCE(p.erp_item_code, 'TEMP-' || p.id),
    COALESCE(p.item_description, p.product_name),
    p.division,
    p.department,
    p.category,
    p.sub_category,
    p.class_name,
    p.brand,
    'active'
FROM products p
JOIN product_requests pr ON p.request_id = pr.id
WHERE p.status = 'approved'
  AND pr.status IN ('completed', 'partially_approved')
  AND NOT EXISTS (
      SELECT 1 FROM item_master im 
      WHERE im.erp_item_code = COALESCE(p.erp_item_code, 'TEMP-' || p.id)
  )
ON CONFLICT (erp_item_code) DO NOTHING;
