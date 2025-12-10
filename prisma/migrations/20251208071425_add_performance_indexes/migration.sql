-- CreateIndex
CREATE INDEX "cart_items_userId_productId_idx" ON "public"."cart_items"("userId", "productId");

-- CreateIndex
CREATE INDEX "orders_orderNumber_idx" ON "public"."orders"("orderNumber");

-- CreateIndex
CREATE INDEX "orders_userId_status_idx" ON "public"."orders"("userId", "status");

-- CreateIndex
CREATE INDEX "orders_userId_createdAt_idx" ON "public"."orders"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "orders_paymentReference_idx" ON "public"."orders"("paymentReference");
