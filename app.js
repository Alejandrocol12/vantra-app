const STORAGE_KEY = "vantra_inventory_app_v1";

const state = loadState();
let lastReportRows = [];
let lastReportName = "reporte";

const titles = {
  dashboard: "Dashboard general",
  inventario: "Inventario de vapers",
  ventas: "Registro de ventas",
  reportes: "Reportes"
};

const money = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0
});

const els = {
  viewTitle: document.querySelector("#viewTitle"),
  navItems: document.querySelectorAll(".nav-item"),
  views: document.querySelectorAll(".view"),
  todaySales: document.querySelector("#todaySales"),
  todayUnits: document.querySelector("#todayUnits"),
  monthSales: document.querySelector("#monthSales"),
  monthOrders: document.querySelector("#monthOrders"),
  lowStockCount: document.querySelector("#lowStockCount"),
  inventoryValue: document.querySelector("#inventoryValue"),
  recentSalesTable: document.querySelector("#recentSalesTable"),
  lowStockList: document.querySelector("#lowStockList"),
  productForm: document.querySelector("#productForm"),
  productFormTitle: document.querySelector("#productFormTitle"),
  productId: document.querySelector("#productId"),
  productName: document.querySelector("#productName"),
  productCategory: document.querySelector("#productCategory"),
  productFlavor: document.querySelector("#productFlavor"),
  productStock: document.querySelector("#productStock"),
  productMinStock: document.querySelector("#productMinStock"),
  productCost: document.querySelector("#productCost"),
  productPrice: document.querySelector("#productPrice"),
  cancelEditProduct: document.querySelector("#cancelEditProduct"),
  inventorySearch: document.querySelector("#inventorySearch"),
  inventoryCategoryFilter: document.querySelector("#inventoryCategoryFilter"),
  inventoryTable: document.querySelector("#inventoryTable"),
  saleForm: document.querySelector("#saleForm"),
  saleProduct: document.querySelector("#saleProduct"),
  saleQuantity: document.querySelector("#saleQuantity"),
  salePayment: document.querySelector("#salePayment"),
  saleNote: document.querySelector("#saleNote"),
  saleTotalPreview: document.querySelector("#saleTotalPreview"),
  salesTable: document.querySelector("#salesTable"),
  reportType: document.querySelector("#reportType"),
  reportPeriod: document.querySelector("#reportPeriod"),
  generateReportBtn: document.querySelector("#generateReportBtn"),
  exportReportBtn: document.querySelector("#exportReportBtn"),
  reportTotalSales: document.querySelector("#reportTotalSales"),
  reportUnits: document.querySelector("#reportUnits"),
  reportProfit: document.querySelector("#reportProfit"),
  reportLowStock: document.querySelector("#reportLowStock"),
  reportHead: document.querySelector("#reportHead"),
  reportBody: document.querySelector("#reportBody"),
  seedDataBtn: document.querySelector("#seedDataBtn"),
  clearDataBtn: document.querySelector("#clearDataBtn"),
  toast: document.querySelector("#toast")
};

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    return { products: [], sales: [] };
  }

  try {
    return JSON.parse(saved);
  } catch {
    return { products: [], sales: [] };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatDate(dateValue) {
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(dateValue));
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => els.toast.classList.remove("show"), 2600);
}

function getLowStockProducts() {
  return state.products.filter((product) => Number(product.stock) <= Number(product.minStock));
}

function getProduct(productId) {
  return state.products.find((product) => product.id === productId);
}

function sameDay(dateA, dateB) {
  return dateA.getFullYear() === dateB.getFullYear()
    && dateA.getMonth() === dateB.getMonth()
    && dateA.getDate() === dateB.getDate();
}

function sameMonth(dateA, dateB) {
  return dateA.getFullYear() === dateB.getFullYear()
    && dateA.getMonth() === dateB.getMonth();
}

function getPeriodStart(period) {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  if (period === "weekly") {
    const day = start.getDay() || 7;
    start.setDate(start.getDate() - day + 1);
  }

  if (period === "monthly") {
    start.setDate(1);
  }

  return start;
}

function getSalesByPeriod(period) {
  const start = getPeriodStart(period);
  return state.sales.filter((sale) => new Date(sale.date) >= start);
}

function renderAll() {
  renderDashboard();
  renderInventory();
  renderSaleProductOptions();
  renderSales();
  renderReport();
  saveState();
}

function renderDashboard() {
  const now = new Date();
  const todaySales = state.sales.filter((sale) => sameDay(new Date(sale.date), now));
  const monthSales = state.sales.filter((sale) => sameMonth(new Date(sale.date), now));
  const todayTotal = todaySales.reduce((sum, sale) => sum + sale.total, 0);
  const todayUnits = todaySales.reduce((sum, sale) => sum + sale.quantity, 0);
  const monthTotal = monthSales.reduce((sum, sale) => sum + sale.total, 0);
  const inventoryValue = state.products.reduce((sum, product) => sum + product.stock * product.price, 0);

  els.todaySales.textContent = money.format(todayTotal);
  els.todayUnits.textContent = `${todayUnits} unidades vendidas`;
  els.monthSales.textContent = money.format(monthTotal);
  els.monthOrders.textContent = `${monthSales.length} ventas registradas`;
  els.lowStockCount.textContent = getLowStockProducts().length;
  els.inventoryValue.textContent = money.format(inventoryValue);

  const recentRows = [...state.sales]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 6)
    .map((sale) => saleRow(sale, false))
    .join("");

  els.recentSalesTable.innerHTML = recentRows || emptyRow("No hay ventas registradas todavía.", 5);

  const lowStock = getLowStockProducts();
  els.lowStockList.innerHTML = lowStock.length
    ? lowStock.map((product) => `
        <div class="stock-alert">
          <div>
            <strong>${escapeHtml(product.name)}</strong>
            <div>${escapeHtml(product.category)} · ${escapeHtml(product.flavor || "Sin referencia")}</div>
          </div>
          <span class="badge low">${product.stock}/${product.minStock}</span>
        </div>
      `).join("")
    : `<div class="empty-state">Todo el inventario está por encima del stock mínimo.</div>`;
}

function renderInventory() {
  const term = els.inventorySearch.value.trim().toLowerCase();
  const category = els.inventoryCategoryFilter.value;

  const products = state.products.filter((product) => {
    const matchesTerm = `${product.name} ${product.flavor} ${product.category}`.toLowerCase().includes(term);
    const matchesCategory = category === "Todas" || product.category === category;
    return matchesTerm && matchesCategory;
  });

  els.inventoryTable.innerHTML = products.length
    ? products.map((product) => `
        <tr>
          <td>
            <div class="product-name">
              <strong>${escapeHtml(product.name)}</strong>
              <small>${escapeHtml(product.flavor || "Sin referencia")}</small>
            </div>
          </td>
          <td>${escapeHtml(product.category)}</td>
          <td><span class="badge ${product.stock <= product.minStock ? "low" : ""}">${product.stock}</span></td>
          <td>${product.minStock}</td>
          <td>${money.format(product.price)}</td>
          <td>
            <div class="row-actions">
              <button class="icon-button" title="Editar producto" data-edit-product="${product.id}">E</button>
              <button class="icon-button" title="Eliminar producto" data-delete-product="${product.id}">X</button>
            </div>
          </td>
        </tr>
      `).join("")
    : emptyRow("No hay productos para mostrar.", 6);
}

function renderSaleProductOptions() {
  const selected = els.saleProduct.value;
  const availableProducts = state.products.filter((product) => product.stock > 0);
  els.saleProduct.innerHTML = availableProducts.length
    ? availableProducts.map((product) => `
        <option value="${product.id}">${escapeHtml(product.name)} (${product.stock} disponibles)</option>
      `).join("")
    : `<option value="">No hay productos con stock</option>`;

  if (availableProducts.some((product) => product.id === selected)) {
    els.saleProduct.value = selected;
  }

  updateSalePreview();
}

function renderSales() {
  const rows = [...state.sales]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .map((sale) => saleRow(sale, true))
    .join("");

  els.salesTable.innerHTML = rows || emptyRow("No hay ventas registradas.", 6);
}

function renderReport() {
  const type = els.reportType.value;
  const period = els.reportPeriod.value;
  const sales = getSalesByPeriod(period);
  const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);
  const units = sales.reduce((sum, sale) => sum + sale.quantity, 0);
  const profit = sales.reduce((sum, sale) => sum + sale.profit, 0);
  const lowStock = getLowStockProducts();

  els.reportTotalSales.textContent = money.format(totalSales);
  els.reportUnits.textContent = units;
  els.reportProfit.textContent = money.format(profit);
  els.reportLowStock.textContent = lowStock.length;

  if (type === "sales") {
    lastReportName = `reporte-ventas-${period}`;
    lastReportRows = sales.map((sale) => ({
      fecha: formatDate(sale.date),
      producto: sale.productName,
      cantidad: sale.quantity,
      pago: sale.payment,
      total: sale.total,
      ganancia: sale.profit,
      nota: sale.note || ""
    }));

    els.reportHead.innerHTML = `
      <tr>
        <th>Fecha</th>
        <th>Producto</th>
        <th>Cant.</th>
        <th>Pago</th>
        <th>Total</th>
        <th>Ganancia</th>
      </tr>
    `;
    els.reportBody.innerHTML = lastReportRows.length
      ? lastReportRows.map((row) => `
          <tr>
            <td>${escapeHtml(row.fecha)}</td>
            <td>${escapeHtml(row.producto)}</td>
            <td>${row.cantidad}</td>
            <td>${escapeHtml(row.pago)}</td>
            <td>${money.format(row.total)}</td>
            <td>${money.format(row.ganancia)}</td>
          </tr>
        `).join("")
      : emptyRow("No hay ventas en este periodo.", 6);
    return;
  }

  lastReportName = `reporte-inventario-${period}`;
  lastReportRows = state.products.map((product) => ({
    producto: product.name,
    categoria: product.category,
    referencia: product.flavor || "",
    stock: product.stock,
    minimo: product.minStock,
    precioVenta: product.price,
    valorInventario: product.stock * product.price,
    estado: product.stock <= product.minStock ? "Stock mínimo" : "Disponible"
  }));

  els.reportHead.innerHTML = `
    <tr>
      <th>Producto</th>
      <th>Categoría</th>
      <th>Stock</th>
      <th>Mín.</th>
      <th>Valor inventario</th>
      <th>Estado</th>
    </tr>
  `;
  els.reportBody.innerHTML = lastReportRows.length
    ? lastReportRows.map((row) => `
        <tr>
          <td>${escapeHtml(row.producto)}</td>
          <td>${escapeHtml(row.categoria)}</td>
          <td>${row.stock}</td>
          <td>${row.minimo}</td>
          <td>${money.format(row.valorInventario)}</td>
          <td><span class="badge ${row.estado === "Stock mínimo" ? "low" : ""}">${row.estado}</span></td>
        </tr>
      `).join("")
    : emptyRow("No hay productos en inventario.", 6);
}

function saleRow(sale, withDelete) {
  return `
    <tr>
      <td>${formatDate(sale.date)}</td>
      <td>${escapeHtml(sale.productName)}</td>
      <td>${sale.quantity}</td>
      <td>${escapeHtml(sale.payment)}</td>
      <td>${money.format(sale.total)}</td>
      ${withDelete ? `<td><button class="icon-button" title="Eliminar venta" data-delete-sale="${sale.id}">X</button></td>` : ""}
    </tr>
  `;
}

function emptyRow(message, columns) {
  return `<tr><td colspan="${columns}" class="empty-state">${message}</td></tr>`;
}

function resetProductForm() {
  els.productForm.reset();
  els.productId.value = "";
  els.productFormTitle.textContent = "Agregar vaper";
  els.cancelEditProduct.style.display = "none";
}

function updateSalePreview() {
  const product = getProduct(els.saleProduct.value);
  const quantity = Number(els.saleQuantity.value || 0);
  els.saleTotalPreview.textContent = money.format(product ? product.price * quantity : 0);
}

function exportCsv() {
  if (!lastReportRows.length) {
    showToast("No hay datos para exportar.");
    return;
  }

  const headers = Object.keys(lastReportRows[0]);
  const csv = [
    headers.join(","),
    ...lastReportRows.map((row) => headers.map((header) => {
      const value = String(row[header] ?? "").replaceAll('"', '""');
      return `"${value}"`;
    }).join(","))
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${lastReportName}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

els.navItems.forEach((button) => {
  button.addEventListener("click", () => {
    const view = button.dataset.view;
    els.navItems.forEach((item) => item.classList.toggle("active", item === button));
    els.views.forEach((item) => item.classList.toggle("active", item.id === view));
    els.viewTitle.textContent = titles[view];
    renderAll();
  });
});

document.querySelectorAll("[data-jump]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelector(`[data-view="${button.dataset.jump}"]`).click();
  });
});

els.productForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const payload = {
    name: els.productName.value.trim(),
    category: els.productCategory.value,
    flavor: els.productFlavor.value.trim(),
    stock: Number(els.productStock.value),
    minStock: Number(els.productMinStock.value),
    cost: Number(els.productCost.value),
    price: Number(els.productPrice.value)
  };

  if (payload.price < payload.cost) {
    showToast("El precio de venta debería ser mayor o igual al costo.");
    return;
  }

  if (els.productId.value) {
    const product = getProduct(els.productId.value);
    Object.assign(product, payload);
    showToast("Producto actualizado.");
  } else {
    state.products.push({ id: uid("product"), ...payload });
    showToast("Producto agregado al inventario.");
  }

  resetProductForm();
  renderAll();
});

els.cancelEditProduct.addEventListener("click", resetProductForm);
els.inventorySearch.addEventListener("input", renderInventory);
els.inventoryCategoryFilter.addEventListener("change", renderInventory);
els.saleProduct.addEventListener("change", updateSalePreview);
els.saleQuantity.addEventListener("input", updateSalePreview);

els.inventoryTable.addEventListener("click", (event) => {
  const editId = event.target.dataset.editProduct;
  const deleteId = event.target.dataset.deleteProduct;

  if (editId) {
    const product = getProduct(editId);
    els.productId.value = product.id;
    els.productName.value = product.name;
    els.productCategory.value = product.category;
    els.productFlavor.value = product.flavor;
    els.productStock.value = product.stock;
    els.productMinStock.value = product.minStock;
    els.productCost.value = product.cost;
    els.productPrice.value = product.price;
    els.productFormTitle.textContent = "Editar vaper";
    els.cancelEditProduct.style.display = "inline-flex";
  }

  if (deleteId) {
    const hasSales = state.sales.some((sale) => sale.productId === deleteId);
    if (hasSales) {
      showToast("No se puede eliminar un producto con ventas registradas.");
      return;
    }
    state.products = state.products.filter((product) => product.id !== deleteId);
    showToast("Producto eliminado.");
    renderAll();
  }
});

els.saleForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const product = getProduct(els.saleProduct.value);
  const quantity = Number(els.saleQuantity.value);

  if (!product) {
    showToast("Agrega inventario disponible antes de vender.");
    return;
  }

  if (quantity > product.stock) {
    showToast("La cantidad supera el stock disponible.");
    return;
  }

  product.stock -= quantity;
  state.sales.push({
    id: uid("sale"),
    productId: product.id,
    productName: product.name,
    quantity,
    payment: els.salePayment.value,
    note: els.saleNote.value.trim(),
    total: product.price * quantity,
    profit: (product.price - product.cost) * quantity,
    date: new Date().toISOString()
  });

  els.saleForm.reset();
  els.saleQuantity.value = 1;
  showToast("Venta registrada y stock descontado.");
  renderAll();
});

els.salesTable.addEventListener("click", (event) => {
  const saleId = event.target.dataset.deleteSale;
  if (!saleId) return;

  const sale = state.sales.find((item) => item.id === saleId);
  const product = getProduct(sale.productId);
  if (product) {
    product.stock += sale.quantity;
  }
  state.sales = state.sales.filter((item) => item.id !== saleId);
  showToast("Venta eliminada y stock restaurado.");
  renderAll();
});

els.generateReportBtn.addEventListener("click", renderReport);
els.reportType.addEventListener("change", renderReport);
els.reportPeriod.addEventListener("change", renderReport);
els.exportReportBtn.addEventListener("click", exportCsv);

els.seedDataBtn.addEventListener("click", () => {
  state.products = [
    { id: uid("product"), name: "Elf Bar BC5000", category: "Desechable", flavor: "Mango Ice", stock: 12, minStock: 5, cost: 28000, price: 45000 },
    { id: uid("product"), name: "Vaporesso XROS 3", category: "Pod", flavor: "Kit negro", stock: 4, minStock: 4, cost: 105000, price: 155000 },
    { id: uid("product"), name: "Líquido Nasty Juice", category: "Líquido", flavor: "Slow Blow 60ml", stock: 8, minStock: 3, cost: 42000, price: 65000 },
    { id: uid("product"), name: "Resistencia GTX", category: "Accesorio", flavor: "0.8 ohm", stock: 2, minStock: 6, cost: 7000, price: 14000 }
  ];
  state.sales = [];
  showToast("Datos de ejemplo cargados.");
  renderAll();
});

els.clearDataBtn.addEventListener("click", () => {
  state.products = [];
  state.sales = [];
  resetProductForm();
  showToast("Datos limpiados.");
  renderAll();
});

resetProductForm();
renderAll();
