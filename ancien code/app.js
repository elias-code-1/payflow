// const menuToggle = document.querySelector("#mobile-menu-toggle");
// const mobileMenu = document.querySelector("#mobile-menu");
// const toast = document.querySelector("#toast");
// let toastTimeout;

// function showToast(message) {
//     if (!toast) return;

//     toast.textContent = message;
//     toast.classList.add("is-visible");
//     window.clearTimeout(toastTimeout);
//     toastTimeout = window.setTimeout(() => {
//         toast.classList.remove("is-visible");
//     }, 2800);
// }

// function setMenuOpen(isOpen) {
//     if (!menuToggle || !mobileMenu) return;

//     menuToggle.setAttribute("aria-expanded", String(isOpen));
//     menuToggle.setAttribute("aria-label", isOpen ? "Fermer le menu" : "Ouvrir le menu");
//     document.body.classList.toggle("mobile-menu-open", isOpen);

//     const icon = menuToggle.querySelector("i");
//     if (icon) {
//         icon.classList.toggle("fa-bars", !isOpen);
//         icon.classList.toggle("fa-xmark", isOpen);
//     }
// }

// if (menuToggle && mobileMenu) {
//     menuToggle.addEventListener("click", () => {
//         const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
//         setMenuOpen(!isOpen);
//     });

//     mobileMenu.addEventListener("click", (event) => {
//         if (event.target.closest("a")) setMenuOpen(false);
//     });

//     document.addEventListener("keydown", (event) => {
//         if (event.key === "Escape") setMenuOpen(false);
//     });
// }

// const operatorButtons = [...document.querySelectorAll(".operator-card")];

// operatorButtons.forEach((button) => {
//     button.addEventListener("click", () => {
//         const isSelected = button.getAttribute("aria-pressed") === "true";
//         button.setAttribute("aria-pressed", String(!isSelected));
//         button.classList.toggle("operator-card-active", !isSelected);
//         document.querySelector(".operator-grid")?.classList.remove("has-error");
//     });
// });

// const paymentForm = document.querySelector("#payment-form");
// const paymentTitle = document.querySelector("#payment-title");
// const paymentAmount = document.querySelector("#payment-amount");
// const paymentCurrency = document.querySelector("#payment-currency");
// const paymentResult = document.querySelector("#payment-result");
// const paymentLink = document.querySelector("#payment-link");

// function createReference() {
//     const time = Date.now().toString(36).toUpperCase();
//     const random = Math.random().toString(36).slice(2, 7).toUpperCase();
//     return `PL-${time}-${random}`;
// }

// if (paymentForm) {
//     paymentForm.addEventListener("submit", (event) => {
//         event.preventDefault();

//         const selectedOperators = operatorButtons
//             .filter((button) => button.getAttribute("aria-pressed") === "true")
//             .map((button) => button.dataset.operator);

//         if (selectedOperators.length === 0) {
//             document.querySelector(".operator-grid")?.classList.add("has-error");
//             showToast("Choisissez au moins un moyen de paiement.");
//             return;
//         }

//         if (!paymentForm.reportValidity()) return;

//         const reference = createReference();
//         const previewUrl = new URL(window.location.href);
//         previewUrl.hash = "";
//         previewUrl.searchParams.set("demo_payment", reference);
//         previewUrl.searchParams.set("amount", paymentAmount.value);
//         previewUrl.searchParams.set("currency", paymentCurrency.value);
//         previewUrl.searchParams.set("network", selectedOperators.join(","));

//         if (paymentLink) paymentLink.textContent = previewUrl.toString();
//         paymentResult?.removeAttribute("hidden");
//         showToast(`Aperçu créé pour « ${paymentTitle.value.trim()} ».`);
//     });
// }

// const exchangeRates = {
//     EUR: 655.95,
//     USD: 600,
//     XOF: 1,
// };

// const currencySymbols = {
//     EUR: "€",
//     USD: "$",
//     XOF: "XOF",
// };

// const simulatorForm = document.querySelector("#simulator-form");
// const simulatorCurrency = document.querySelector("#simulator-currency");
// const simulatorAmount = document.querySelector("#simulator-amount");

// function formatAmount(value, maximumFractionDigits = 0) {
//     return new Intl.NumberFormat("fr-FR", {
//         maximumFractionDigits,
//         minimumFractionDigits: 0,
//     }).format(value);
// }

// function updateConversion() {
//     if (!simulatorCurrency || !simulatorAmount) return;

//     const currency = simulatorCurrency.value;
//     const amount = Math.max(0, Number(simulatorAmount.value) || 0);
//     const rate = exchangeRates[currency] ?? exchangeRates.EUR;
//     const gross = amount * rate;
//     const fees = gross * 0.025;
//     const net = gross - fees;
//     const sourceAmount = formatAmount(amount, currency === "XOF" ? 0 : 2);
//     const sourceRate = formatAmount(rate, 2);

//     document.querySelector("#conversion-input").textContent = `${sourceAmount} ${currencySymbols[currency]}`;
//     document.querySelector("#conversion-rate").textContent = `1 ${currency} = ${sourceRate} XOF`;
//     document.querySelector("#conversion-gross").textContent = `${formatAmount(gross)} XOF`;
//     document.querySelector("#conversion-fees").textContent = `− ${formatAmount(fees)} XOF`;
//     document.querySelector("#conversion-net").textContent = `${formatAmount(net)} XOF`;
// }

// if (simulatorForm) {
//     simulatorForm.addEventListener("submit", (event) => event.preventDefault());
//     simulatorCurrency?.addEventListener("change", updateConversion);
//     simulatorAmount?.addEventListener("input", updateConversion);
//     updateConversion();
// }

// async function copyText(value, successMessage) {
//     try {
//         if (navigator.clipboard && window.isSecureContext) {
//             await navigator.clipboard.writeText(value);
//         } else {
//             const temporaryInput = document.createElement("textarea");
//             temporaryInput.value = value;
//             temporaryInput.className = "clipboard-fallback";
//             temporaryInput.setAttribute("readonly", "");
//             document.body.append(temporaryInput);
//             temporaryInput.select();
//             const copied = document.execCommand("copy");
//             temporaryInput.remove();
//             if (!copied) throw new Error("Copie impossible");
//         }

//         showToast(successMessage);
//     } catch {
//         showToast("La copie a échoué. Sélectionnez le texte et copiez-le manuellement.");
//     }
// }

// document.querySelector("#copy-payment-link")?.addEventListener("click", () => {
//     if (paymentLink?.textContent) {
//         copyText(paymentLink.textContent, "Lien de démonstration copié.");
//     }
// });

// document.querySelector("#copy-api-example")?.addEventListener("click", () => {
//     const example = document.querySelector("#developers pre code")?.textContent;
//     if (example) copyText(example, "Exemple API copié.");
// });
