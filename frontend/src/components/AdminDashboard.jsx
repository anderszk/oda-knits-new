import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { assetUrl } from "../api";

const API_BASE = import.meta.env.VITE_API_URL || "";
const blankProject = {
  title: "",
  category: "",
  description: "",
  image: "",
  images: [],
  yarn: "",
  fiber: "",
  technique: "",
  needles: "",
  size: "",
  time: "",
  year: "",
  colors: [{ name: "Petal", hex: "#bd5bd3" }],
};
const blankAbout = {
  name: "",
  headline: "",
  body: [""],
  details: [{ label: "", value: "" }],
  stats: [{ label: "", value: "" }],
};
const blankContact = {
  eyebrow: "",
  heading: "",
  body: "",
  button: "",
  success: "",
};
const blankProduct = {
  title: "",
  category: "",
  price: "",
  description: "",
  colors: [{ name: "Petal", hex: "#bd5bd3" }],
  sizes: ["One size"],
  badge: "",
  stock: "",
  image: "",
};
const inputClass = "min-w-0 w-full rounded-md border border-ink/20 bg-cream px-3 py-2 transition hover:border-star/70 focus:border-star focus:bg-white focus:outline-none focus:ring-2 focus:ring-star/20";
const labelClass = "grid gap-1.5 text-sm font-bold text-[#625768]";
const buttonClass = "rounded-md font-extrabold transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-star";

function TextField({ label, ...props }) {
  return (
    <label className={labelClass}>
      <span>{label}</span>
      <input className={inputClass} {...props} />
    </label>
  );
}

function TextAreaField({ label, ...props }) {
  return (
    <label className={labelClass}>
      <span>{label}</span>
      <textarea className={`${inputClass} min-h-28 resize-y`} {...props} />
    </label>
  );
}

function validateProject(project) {
  const required = [
    ["Project title", project.title],
    ["Category", project.category],
    ["Finish year or WIP", project.year],
    ["Making time", project.time],
    ["Modal description", project.description],
    ["Yarn", project.yarn],
    ["Fiber", project.fiber],
    ["Technique", project.technique],
    ["Needles", project.needles],
    ["Size", project.size],
  ];
  const missing = required.find(([, value]) => !String(value || "").trim());
  if (missing) return `${missing[0]} is required.`;
  if (!project.images?.length) return "At least one project image is required.";
  if (!project.colors?.length) return "At least one color is required.";
  if (project.colors.some((color) => !color.name.trim())) return "Every color needs a name.";
  return "";
}

function validateProduct(product) {
  const required = [
    ["Product title", product.title],
    ["Category", product.category],
    ["Description", product.description],
  ];
  const missing = required.find(([, value]) => !String(value || "").trim());
  if (missing) return `${missing[0]} is required.`;
  if (product.price === "" || Number(product.price) < 0) return "Price is required.";
  if (product.stock === "" || Number(product.stock) < 0) return "Stock is required.";
  if (!product.colors?.length) return "At least one color is required.";
  if (product.colors.some((color) => !color.name.trim())) return "Every color needs a name.";
  if (!product.sizes?.length) return "At least one size is required.";
  return "";
}

export default function AdminDashboard() {
  const isAboutPage = window.location.pathname.startsWith("/admin/about");
  const isContactPage = window.location.pathname.startsWith("/admin/contact");
  const isProductsPage = window.location.pathname.startsWith("/admin/products");
  const [token, setToken] = useState(() => localStorage.getItem("oda-admin-token") || "");
  const [login, setLogin] = useState({ username: "", password: "" });
  const [projects, setProjects] = useState([]);
  const [editingId, setEditingId] = useState("");
  const [form, setForm] = useState(blankProject);
  const [aboutForm, setAboutForm] = useState(blankAbout);
  const [contactForm, setContactForm] = useState(blankContact);
  const [products, setProducts] = useState([]);
  const [editingProductId, setEditingProductId] = useState("");
  const [productForm, setProductForm] = useState(blankProduct);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const isEditing = Boolean(editingId);
  const isEditingProduct = Boolean(editingProductId);

  const authHeaders = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  async function request(path, options = {}) {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: { ...authHeaders, ...(options.headers || {}) },
    });
    if (response.status === 401) {
      localStorage.removeItem("oda-admin-token");
      setToken("");
      throw new Error("Please log in again.");
    }
    if (!response.ok) throw new Error((await response.json().catch(() => ({}))).detail || `Request failed: ${response.status}`);
    return response.status === 204 ? null : response.json();
  }

  async function loadProjects() {
    setError("");
    setProjects(await request("/api/admin/projects"));
  }

  async function loadAbout() {
    setError("");
    setAboutForm(await request("/api/admin/about"));
  }

  async function loadContact() {
    setError("");
    setContactForm(await request("/api/admin/contact-info"));
  }

  async function loadProducts() {
    setError("");
    setProducts(await request("/api/admin/products"));
  }

  useEffect(() => {
    if (!token) return;
    (isContactPage ? loadContact() : isAboutPage ? loadAbout() : isProductsPage ? loadProducts() : loadProjects()).catch((caught) => setError(caught.message));
  }, [token, isAboutPage, isContactPage, isProductsPage]);

  async function submitLogin(event) {
    event.preventDefault();
    setError("");
    const response = await fetch(`${API_BASE}/api/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(login),
    });
    if (!response.ok) {
      setError((await response.json().catch(() => ({}))).detail || "Wrong username or password.");
      return;
    }
    const data = await response.json();
    localStorage.setItem("oda-admin-token", data.token);
    setToken(data.token);
  }

  function editProject(project) {
    setEditingId(project.id);
    setForm({ ...blankProject, ...project, images: project.images || [], colors: project.colors?.length ? project.colors : blankProject.colors });
    setMessage("");
    setError("");
  }

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  const isWip = String(form.year || "").trim().toLowerCase() === "wip";

  function updateColor(index, field, value) {
    setForm((current) => ({
      ...current,
      colors: current.colors.map((color, colorIndex) => (colorIndex === index ? { ...color, [field]: value } : color)),
    }));
  }

  function updateAboutList(list, index, field, value) {
    setAboutForm((current) => ({
      ...current,
      [list]: current[list].map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item)),
    }));
  }

  async function uploadImage(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const body = new FormData();
    body.append("file", file);
    const { url } = await request("/api/admin/uploads", { method: "POST", body });
    setForm((current) => ({ ...current, image: current.image || url, images: [...new Set([...(current.images || []), url])] }));
    event.target.value = "";
  }

  async function uploadProductImage(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const body = new FormData();
    body.append("file", file);
    const { url } = await request("/api/admin/uploads", { method: "POST", body });
    setProductForm((current) => ({ ...current, image: url }));
    event.target.value = "";
  }

  async function saveProject(event) {
    event.preventDefault();
    setError("");
    const validationError = validateProject(form);
    if (validationError) {
      setError(validationError);
      return;
    }
    const path = isEditing ? `/api/admin/projects/${editingId}` : "/api/admin/projects";
    await request(path, {
      method: isEditing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setMessage(isEditing ? "Project updated." : "Project created.");
    setEditingId("");
    setForm(blankProject);
    await loadProjects();
  }

  async function removeProject(id) {
    await request(`/api/admin/projects/${id}`, { method: "DELETE" });
    setProjects((current) => current.filter((project) => project.id !== id));
    if (editingId === id) {
      setEditingId("");
      setForm(blankProject);
    }
  }

  function editProduct(product) {
    setEditingProductId(product.id);
    setProductForm({ ...blankProduct, ...product, colors: product.colors?.length ? product.colors : blankProduct.colors, sizes: product.sizes?.length ? product.sizes : blankProduct.sizes });
    setMessage("");
    setError("");
  }

  function updateProductField(field, value) {
    setProductForm((current) => ({ ...current, [field]: value }));
  }

  function updateProductColor(index, field, value) {
    setProductForm((current) => ({
      ...current,
      colors: current.colors.map((color, colorIndex) => (colorIndex === index ? { ...color, [field]: value } : color)),
    }));
  }

  async function saveProduct(event) {
    event.preventDefault();
    setError("");
    const validationError = validateProduct(productForm);
    if (validationError) {
      setError(validationError);
      return;
    }
    const payload = { ...productForm, price: Number(productForm.price), stock: Number(productForm.stock) };
    const path = isEditingProduct ? `/api/admin/products/${editingProductId}` : "/api/admin/products";
    await request(path, {
      method: isEditingProduct ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setMessage(isEditingProduct ? "Product updated." : "Product created.");
    setEditingProductId("");
    setProductForm(blankProduct);
    await loadProducts();
  }

  async function removeProduct(id) {
    await request(`/api/admin/products/${id}`, { method: "DELETE" });
    setProducts((current) => current.filter((product) => product.id !== id));
    if (editingProductId === id) {
      setEditingProductId("");
      setProductForm(blankProduct);
    }
  }

  async function saveAbout(event) {
    event.preventDefault();
    setError("");
    await request("/api/admin/about", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(aboutForm),
    });
    setMessage("About section updated.");
  }

  async function saveContact(event) {
    event.preventDefault();
    setError("");
    await request("/api/admin/contact-info", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(contactForm),
    });
    setMessage("Contact section updated.");
  }

  if (!token) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-cream px-4 py-16 text-ink">
        <motion.form className="mx-auto grid max-w-sm gap-4 rounded-lg border border-ink/15 bg-white p-6 shadow-[0_24px_60px_rgba(61,48,70,.13)]" onSubmit={submitLogin} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <a className="font-display text-2xl font-bold" href="/">Oda Knits<span className="text-star">*</span></a>
          <h1 className="font-display text-4xl leading-none max-[380px]:text-3xl">Admin</h1>
          <TextField label="Username" value={login.username} onChange={(event) => setLogin({ ...login, username: event.target.value })} />
          <TextField label="Password" type="password" value={login.password} onChange={(event) => setLogin({ ...login, password: event.target.value })} />
          {error && <p className="text-sm font-bold text-wine">{error}</p>}
          <button className={`${buttonClass} bg-ink px-4 py-3 text-cream hover:bg-star`} type="submit">Log in</button>
        </motion.form>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cream px-[clamp(1rem,4vw,4rem)] py-8 text-ink">
      <div className="mx-auto max-w-7xl">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <a className="font-display text-3xl font-bold max-[380px]:text-2xl" href="/">Oda Knits<span className="text-star">*</span></a>
        <div className="flex flex-wrap items-center gap-2">
          <a className={`${buttonClass} border px-4 py-2 font-bold ${isContactPage ? "border-star bg-star text-white" : "border-ink bg-white hover:border-star hover:text-star"}`} href="/admin/contact">Contact</a>
          <a className={`${buttonClass} border px-4 py-2 font-bold ${isAboutPage ? "border-star bg-star text-white" : "border-ink bg-white hover:border-star hover:text-star"}`} href="/admin/about">About</a>
          <a className={`${buttonClass} border px-4 py-2 font-bold ${isProductsPage ? "border-star bg-star text-white" : "border-ink bg-white hover:border-star hover:text-star"}`} href="/admin/products">Products</a>
          <a className={`${buttonClass} border px-4 py-2 font-bold ${!isAboutPage && !isContactPage && !isProductsPage ? "border-star bg-star text-white" : "border-ink bg-white hover:border-star hover:text-star"}`} href="/admin">Projects</a>
          <button className={`${buttonClass} border border-ink bg-white px-4 py-2 font-bold hover:border-star hover:text-star`} onClick={() => { localStorage.removeItem("oda-admin-token"); setToken(""); }} type="button">Log out</button>
        </div>
      </header>

      {isContactPage ? (
        <form className="mx-auto grid max-w-4xl gap-5 rounded-lg border border-ink/15 bg-white p-5" onSubmit={saveContact}>
          <div>
            <p className="mb-2 text-xs font-extrabold uppercase text-wine">Contact page</p>
            <h1 className="font-display text-5xl leading-none max-[620px]:text-4xl">Edit Contact section</h1>
          </div>

          {(message || error) && <p className={`rounded-md px-3 py-2 text-sm font-bold ${error ? "bg-[#ffe3e3] text-wine" : "bg-mint text-ink"}`}>{error || message}</p>}

          <TextField label="Eyebrow" required value={contactForm.eyebrow} onChange={(event) => setContactForm({ ...contactForm, eyebrow: event.target.value })} />
          <TextField label="Heading" required value={contactForm.heading} onChange={(event) => setContactForm({ ...contactForm, heading: event.target.value })} />
          <TextAreaField label="Body text" required value={contactForm.body} onChange={(event) => setContactForm({ ...contactForm, body: event.target.value })} />
          <TextField label="Button text" required value={contactForm.button} onChange={(event) => setContactForm({ ...contactForm, button: event.target.value })} />
          <TextField label="Success message" required value={contactForm.success} onChange={(event) => setContactForm({ ...contactForm, success: event.target.value })} />
          <p className="m-0 text-sm font-bold text-[#6f6674]">Use {"{name}"} in the success message to include the sender's name.</p>

          <button className={`${buttonClass} bg-ink px-5 py-3 text-cream hover:bg-star`} type="submit">Save Contact section</button>
        </form>
      ) : isAboutPage ? (
        <form className="mx-auto grid max-w-4xl gap-5 rounded-lg border border-ink/15 bg-white p-5" onSubmit={saveAbout}>
          <div>
            <p className="mb-2 text-xs font-extrabold uppercase text-wine">About page</p>
            <h1 className="font-display text-5xl leading-none max-[620px]:text-4xl">Edit About section</h1>
          </div>

          {(message || error) && <p className={`rounded-md px-3 py-2 text-sm font-bold ${error ? "bg-[#ffe3e3] text-wine" : "bg-mint text-ink"}`}>{error || message}</p>}

          <TextField label="Intro name" required value={aboutForm.name} onChange={(event) => setAboutForm({ ...aboutForm, name: event.target.value })} />
          <TextField label="Headline" required value={aboutForm.headline} onChange={(event) => setAboutForm({ ...aboutForm, headline: event.target.value })} />
          <TextAreaField label="Body paragraphs" required value={aboutForm.body.join("\n\n")} onChange={(event) => setAboutForm({ ...aboutForm, body: event.target.value.split(/\n\n+/).map((item) => item.trim()).filter(Boolean) })} />

          <section className="grid gap-3">
            <div className="flex items-center justify-between gap-3">
              <label className="text-sm font-extrabold uppercase text-wine">Details</label>
              <button className={`${buttonClass} border border-ink bg-white px-3 py-1.5 text-sm font-bold hover:border-star hover:text-star`} onClick={() => setAboutForm({ ...aboutForm, details: [...aboutForm.details, { label: "", value: "" }] })} type="button">Add detail</button>
            </div>
            {aboutForm.details.map((detail, index) => (
              <div className="grid gap-3 rounded-md border border-ink/15 bg-cream p-3 md:grid-cols-[1fr_1.5fr_auto]" key={index}>
                <TextField label="Label" required value={detail.label} onChange={(event) => updateAboutList("details", index, "label", event.target.value)} />
                <TextField label="Value" required value={detail.value} onChange={(event) => updateAboutList("details", index, "value", event.target.value)} />
                <button className="self-end rounded border border-ink/20 px-3 py-2 text-sm font-bold transition hover:border-wine hover:text-wine disabled:cursor-not-allowed disabled:opacity-45" disabled={aboutForm.details.length <= 1} onClick={() => setAboutForm({ ...aboutForm, details: aboutForm.details.filter((_, itemIndex) => itemIndex !== index) })} type="button">Remove</button>
              </div>
            ))}
          </section>

          <section className="grid gap-3">
            <div className="flex items-center justify-between gap-3">
              <label className="text-sm font-extrabold uppercase text-wine">Stats</label>
              <button className={`${buttonClass} border border-ink bg-white px-3 py-1.5 text-sm font-bold hover:border-star hover:text-star`} onClick={() => setAboutForm({ ...aboutForm, stats: [...aboutForm.stats, { label: "", value: "" }] })} type="button">Add stat</button>
            </div>
            {aboutForm.stats.map((stat, index) => (
              <div className="grid gap-3 rounded-md border border-ink/15 bg-cream p-3 md:grid-cols-[1fr_1.5fr_auto]" key={index}>
                <TextField label="Value" required value={stat.value} onChange={(event) => updateAboutList("stats", index, "value", event.target.value)} />
                <TextField label="Label" required value={stat.label} onChange={(event) => updateAboutList("stats", index, "label", event.target.value)} />
                <button className="self-end rounded border border-ink/20 px-3 py-2 text-sm font-bold transition hover:border-wine hover:text-wine disabled:cursor-not-allowed disabled:opacity-45" disabled={aboutForm.stats.length <= 1} onClick={() => setAboutForm({ ...aboutForm, stats: aboutForm.stats.filter((_, itemIndex) => itemIndex !== index) })} type="button">Remove</button>
              </div>
            ))}
          </section>

          <button className={`${buttonClass} bg-ink px-5 py-3 text-cream hover:bg-star`} type="submit">Save About section</button>
        </form>
      ) : isProductsPage ? (
      <div className="grid gap-6 lg:grid-cols-[minmax(18rem,25rem)_1fr]">
        <aside className="rounded-lg border border-ink/15 bg-white p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h1 className="font-display text-4xl">Products</h1>
            <button className={`${buttonClass} bg-star px-3 py-2 text-sm text-white hover:bg-wine`} onClick={() => { setEditingProductId(""); setProductForm(blankProduct); }} type="button">New</button>
          </div>
          <div className="grid gap-3">
            {products.map((product) => (
              <button className={`grid cursor-pointer grid-cols-[3.5rem_1fr_auto] gap-3 rounded-md border p-3 text-left transition hover:-translate-y-0.5 hover:border-star hover:shadow-[0_10px_24px_rgba(61,48,70,.12)] ${editingProductId === product.id ? "border-star bg-[#f9effb]" : "border-ink/10 bg-cream"}`} key={product.id} onClick={() => editProduct(product)} type="button">
                {product.image ? (
                  <img className="size-14 rounded object-cover" src={assetUrl(product.image)} alt="" />
                ) : (
                  <span className="grid size-14 place-items-center rounded bg-white/60 font-display text-2xl text-ink/25" aria-hidden="true">*</span>
                )}
                <span className="min-w-0 self-center">
                  <b className="block truncate">{product.title}</b>
                  <span className="block truncate text-sm text-[#6f6674]">{product.category}</span>
                </span>
                <span className="self-center text-sm font-extrabold text-rose">{product.price} kr</span>
              </button>
            ))}
            {!products.length && <p className="text-sm font-bold text-[#6f6674]">No products yet. Create the first one.</p>}
          </div>
        </aside>

        <form className="grid gap-5 rounded-lg border border-ink/15 bg-white p-5" onSubmit={saveProduct}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="mb-2 text-xs font-extrabold uppercase text-wine">{isEditingProduct ? "Editing product" : "New product"}</p>
              <h2 className="font-display text-5xl leading-none max-[620px]:text-4xl max-[380px]:text-3xl">{productForm.title || "Untitled piece"}</h2>
            </div>
            {isEditingProduct && <button className={`${buttonClass} border border-wine bg-white px-3 py-2 font-bold text-wine hover:bg-wine hover:text-white`} onClick={() => removeProduct(editingProductId)} type="button">Delete</button>}
          </div>

          {(message || error) && <p className={`rounded-md px-3 py-2 text-sm font-bold ${error ? "bg-[#ffe3e3] text-wine" : "bg-mint text-ink"}`}>{error || message}</p>}

          <div className="grid gap-3 md:grid-cols-2">
            <TextField label="Product title" required value={productForm.title} onChange={(event) => updateProductField("title", event.target.value)} />
            <TextField label="Category" required value={productForm.category} onChange={(event) => updateProductField("category", event.target.value)} />
            <TextField label="Price (kr)" type="number" min="0" required value={productForm.price} onChange={(event) => updateProductField("price", event.target.value)} />
            <TextField label="Stock" type="number" min="0" required value={productForm.stock} onChange={(event) => updateProductField("stock", event.target.value)} />
            <TextField label="Badge (optional)" value={productForm.badge} onChange={(event) => updateProductField("badge", event.target.value)} />
            <TextField label="Sizes (comma separated)" required value={productForm.sizes.join(", ")} onChange={(event) => updateProductField("sizes", event.target.value.split(",").map((size) => size.trim()).filter(Boolean))} />
          </div>

          <TextAreaField label="Description" required value={productForm.description} onChange={(event) => updateProductField("description", event.target.value)} />

          <section className="grid gap-3">
            <label className="text-sm font-extrabold uppercase text-wine">Photo</label>
            <input className="min-w-0 w-full rounded-md border border-dashed border-ink/30 bg-cream px-3 py-3 transition hover:border-star focus:outline-none focus:ring-2 focus:ring-star/20" type="file" accept="image/*" onChange={uploadProductImage} />
            {productForm.image && (
              <div className="w-40 overflow-hidden rounded-md border border-ink/15 bg-cream">
                <img className="aspect-square w-full object-cover" src={assetUrl(productForm.image)} alt="" />
                <button className="w-full px-2 py-1.5 text-xs font-bold text-wine transition hover:bg-[#ffe3e3]" onClick={() => updateProductField("image", "")} type="button">Remove photo</button>
              </div>
            )}
          </section>

          <section className="grid gap-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-extrabold uppercase text-wine">Colors</label>
              <button className={`${buttonClass} shrink-0 border border-ink bg-white px-3 py-1.5 text-sm font-bold hover:border-star hover:text-star`} onClick={() => updateProductField("colors", [...productForm.colors, { name: "New color", hex: "#f2b7c6" }])} type="button">Add color</button>
            </div>
            {!productForm.colors?.length && <p className="text-sm font-bold text-wine">Add at least one color.</p>}
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {productForm.colors.map((color, index) => (
                <div className="grid grid-cols-[3rem_1fr_auto] gap-2 rounded-md border border-ink/15 bg-cream p-2 transition hover:border-star max-[380px]:grid-cols-[3rem_1fr]" key={`${color.name}-${index}`}>
                  <input className="h-10 w-full cursor-pointer border-0 bg-transparent" type="color" value={color.hex} onChange={(event) => updateProductColor(index, "hex", event.target.value)} />
                  <input className="min-w-0 rounded border border-ink/15 bg-white px-2 transition hover:border-star focus:border-star focus:outline-none focus:ring-2 focus:ring-star/20" aria-label="Color name" value={color.name} onChange={(event) => updateProductColor(index, "name", event.target.value)} />
                  <button className="rounded border border-ink/20 px-2 text-sm font-bold transition hover:border-wine hover:text-wine max-[380px]:col-span-2 max-[380px]:min-h-10" onClick={() => updateProductField("colors", productForm.colors.filter((_, colorIndex) => colorIndex !== index))} type="button">Remove</button>
                </div>
              ))}
            </div>
          </section>

          <button className={`${buttonClass} bg-ink px-5 py-3 text-cream hover:bg-star`} type="submit">{isEditingProduct ? "Save product" : "Create product"}</button>
        </form>
      </div>
      ) : (
      <div className="grid gap-6 lg:grid-cols-[minmax(18rem,25rem)_1fr]">
        <aside className="rounded-lg border border-ink/15 bg-white p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h1 className="font-display text-4xl">Projects</h1>
            <button className={`${buttonClass} bg-star px-3 py-2 text-sm text-white hover:bg-wine`} onClick={() => { setEditingId(""); setForm(blankProject); }} type="button">New</button>
          </div>
          <div className="grid gap-3">
            {projects.map((project) => (
              <button className={`grid cursor-pointer grid-cols-[4.5rem_1fr] gap-3 rounded-md border p-2 text-left transition hover:-translate-y-0.5 hover:border-star hover:shadow-[0_10px_24px_rgba(61,48,70,.12)] ${editingId === project.id ? "border-star bg-[#f9effb]" : "border-ink/10 bg-cream"}`} key={project.id} onClick={() => editProject(project)} type="button">
                <img className="h-20 w-full rounded object-cover" src={assetUrl(project.image)} alt="" />
                <span className="min-w-0 self-center">
                  <b className="block truncate">{project.title}</b>
                  <span className="block truncate text-sm text-[#6f6674]">{project.category}</span>
                </span>
              </button>
            ))}
          </div>
        </aside>

        <form className="grid gap-5 rounded-lg border border-ink/15 bg-white p-5" onSubmit={saveProject}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="mb-2 text-xs font-extrabold uppercase text-wine">{isEditing ? "Editing project" : "New project"}</p>
              <h2 className="font-display text-5xl leading-none max-[620px]:text-4xl max-[380px]:text-3xl">{form.title || "Untitled knit"}</h2>
            </div>
            {isEditing && <button className={`${buttonClass} border border-wine bg-white px-3 py-2 font-bold text-wine hover:bg-wine hover:text-white`} onClick={() => removeProject(editingId)} type="button">Delete</button>}
          </div>

          {(message || error) && <p className={`rounded-md px-3 py-2 text-sm font-bold ${error ? "bg-[#ffe3e3] text-wine" : "bg-mint text-ink"}`}>{error || message}</p>}

          <div className="grid gap-3 md:grid-cols-2">
            <TextField label="Project title" required value={form.title} onChange={(event) => updateField("title", event.target.value)} />
            <TextField label="Category" required value={form.category} onChange={(event) => updateField("category", event.target.value)} />
            <div className="grid gap-2">
              <TextField label="Finish year" disabled={isWip} required value={isWip ? "" : form.year} onChange={(event) => updateField("year", event.target.value)} />
              <label className="flex items-center gap-2 text-sm font-extrabold text-[#625768]">
                <input className="size-4 accent-star" type="checkbox" checked={isWip} onChange={(event) => updateField("year", event.target.checked ? "WIP" : "")} />
                Work in progress
              </label>
            </div>
            <TextField label="Making time" required value={form.time} onChange={(event) => updateField("time", event.target.value)} />
          </div>

          <TextAreaField label="Modal description" required value={form.description} onChange={(event) => updateField("description", event.target.value)} />

          <div className="grid gap-3 md:grid-cols-2">
            {["yarn", "fiber", "technique", "needles", "size"].map((field) => (
              <TextField label={field[0].toUpperCase() + field.slice(1)} required key={field} value={form[field]} onChange={(event) => updateField(field, event.target.value)} />
            ))}
          </div>

          <section className="grid gap-3">
            <label className="text-sm font-extrabold uppercase text-wine">Images</label>
            {!form.images?.length && <p className="text-sm font-bold text-wine">Upload at least one image.</p>}
            <input className="min-w-0 w-full rounded-md border border-dashed border-ink/30 bg-cream px-3 py-3 transition hover:border-star focus:outline-none focus:ring-2 focus:ring-star/20" type="file" accept="image/*" onChange={uploadImage} />
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {(form.images || []).map((image) => (
                <div className="overflow-hidden rounded-md border border-ink/15 bg-cream transition hover:-translate-y-0.5 hover:border-star hover:shadow-[0_10px_24px_rgba(61,48,70,.12)]" key={image}>
                  <img className="h-36 w-full object-cover" src={assetUrl(image)} alt="" />
                  <div className="flex gap-2 p-2">
                    <button className="flex-1 rounded bg-ink px-2 py-1 text-xs font-bold text-cream transition hover:bg-star" onClick={() => updateField("image", image)} type="button">{form.image === image ? "Cover" : "Use cover"}</button>
                    <button
                      className="rounded border border-ink/20 px-2 py-1 text-xs font-bold transition hover:border-wine hover:text-wine disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:border-ink/20 disabled:hover:text-ink"
                      disabled={form.images.length <= 1}
                      onClick={() => updateField("images", form.images.filter((item) => item !== image))}
                      type="button"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-extrabold uppercase text-wine">Colors</label>
              <button className={`${buttonClass} shrink-0 border border-ink bg-white px-3 py-1.5 text-sm font-bold hover:border-star hover:text-star`} onClick={() => updateField("colors", [...form.colors, { name: "New color", hex: "#f2b7c6" }])} type="button">Add color</button>
            </div>
            {!form.colors?.length && <p className="text-sm font-bold text-wine">Add at least one color.</p>}
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {form.colors.map((color, index) => (
                <div className="grid grid-cols-[3rem_1fr_auto] gap-2 rounded-md border border-ink/15 bg-cream p-2 transition hover:border-star max-[380px]:grid-cols-[3rem_1fr]" key={`${color.name}-${index}`}>
                  <input className="h-10 w-full cursor-pointer border-0 bg-transparent" type="color" value={color.hex} onChange={(event) => updateColor(index, "hex", event.target.value)} />
                  <input className="min-w-0 rounded border border-ink/15 bg-white px-2 transition hover:border-star focus:border-star focus:outline-none focus:ring-2 focus:ring-star/20" aria-label="Color name" value={color.name} onChange={(event) => updateColor(index, "name", event.target.value)} />
                  <button className="rounded border border-ink/20 px-2 text-sm font-bold transition hover:border-wine hover:text-wine max-[380px]:col-span-2 max-[380px]:min-h-10" onClick={() => updateField("colors", form.colors.filter((_, colorIndex) => colorIndex !== index))} type="button">Remove</button>
                </div>
              ))}
            </div>
          </section>

          <button className={`${buttonClass} bg-ink px-5 py-3 text-cream hover:bg-star`} type="submit">{isEditing ? "Save project" : "Create project"}</button>
        </form>
      </div>
      )}
      </div>
    </main>
  );
}
