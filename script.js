/************ CONFIG ************/
const BIN_ID   = "68bb36c1d0ea881f4073162c";   // your bin id
const API_KEY  = "$2a$10$FpSddJCx8IVth3u50X7kdeQbeDoXRYHcgCKQN9iqERYCEdut5mhqa"; // your X-Master-Key
const BASE_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;
 /********************************/

/******** FETCH & SAVE HELPERS ********/
async function fetchCustomers() {
  const res = await fetch(BASE_URL + "/latest", {
    method: "GET",
    headers: {
      "X-Master-Key": API_KEY,
      "X-Bin-Meta": "false"
    }
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`GET ${res.status}: ${text}`);
  const data = JSON.parse(text);
  return data.record || [];
}

async function saveCustomers(customers) {
  const body = { record: customers };
  const res = await fetch(BASE_URL, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-Master-Key": API_KEY
    },
    body: JSON.stringify(body)
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`PUT ${res.status}: ${text}`);
  return JSON.parse(text);
}

/******** FORM (index.html) ********/
const form = document.getElementById("customerForm");
if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const msgEl = document.getElementById("message");

    const customer = {
      firstName: document.getElementById("firstName").value,
      lastName:  document.getElementById("lastName").value,
      age:       document.getElementById("age").value,
      height:    document.getElementById("height").value,
      weight:    document.getElementById("weight").value
      // ❌ ما في progress هنا
    };

    try {
      const customers = await fetchCustomers();
      customers.push(customer);
      await saveCustomers(customers);

      msgEl.textContent = "✅ Your info has been submitted!";
      form.reset();
    } catch (err) {
      console.error(err);
      msgEl.textContent = `❌ Something went wrong. ${err.message}`;
    }
  });
}

/******** ADMIN (admin.html) ********/
const customerList = document.getElementById("customerList");
if (customerList) {
  (async () => {
    try {
      let customers = await fetchCustomers();

      function render() {
        if (!customers.length) {
          customerList.innerHTML = "<p>No submissions yet.</p>";
          return;
        }
        customerList.innerHTML = customers.map((c, i) => {
          // Calculate BMI
          let bmi = "-";
          if (c.height && c.weight) {
            let h = parseFloat(c.height) / 100;
            let w = parseFloat(c.weight);
            if (h > 0) bmi = (w / (h * h)).toFixed(1);
          }

          let progress = c.progress || "0%";

          return `
            <div class="customer-card">
              <h3>${c.firstName || ""} ${c.lastName || ""}</h3>
              <p>Age: ${c.age || "-"}</p>
              <p>Height: ${c.height || "-"} cm</p>
              <p>Weight: ${c.weight || "-"} kg</p>
              <p><b>BMI:</b> ${bmi}</p>
              <p><b>Progress:</b> ${progress} <a href="#" onclick="editProgress(${i}); return false;">[edit]</a></p>
              <button onclick="deleteCustomer(${i})">🗑️ Delete</button>
            </div>
          `;
        }).join("");
      }

      render();

      // Delete
      window.deleteCustomer = async function(index) {
        if (confirm("Are you sure you want to delete this customer?")) {
          customers.splice(index, 1);
          await saveCustomers(customers);
          render();
        }
      };

      // Edit progress (numbers only)
      window.editProgress = async function(index) {
        let newProgress = prompt("Enter new progress (%) number only:", customers[index].progress || "0");
        if (newProgress !== null) {
          let num = parseInt(newProgress);
          if (!isNaN(num) && num >= 0 && num <= 100) {
            customers[index].progress = num + "%";
            await saveCustomers(customers);
            render();
          } else {
            alert("❌ Please enter a valid number between 0 and 100.");
          }
        }
      };

    } catch (err) {
      console.error(err);
      customerList.innerHTML = `<p>❌ Error loading data. ${err.message}</p>`;
    }
  })();
}

/******** SEARCH FEATURE (admin.html) ********/
const searchBox = document.getElementById("searchBox");
if (customerList && searchBox) {
  let allCustomers = [];

  async function renderCustomers(filter = "") {
    try {
      if (!allCustomers.length) {
        allCustomers = await fetchCustomers();
      }
      let filtered = allCustomers;
      if (filter) {
        filtered = allCustomers.filter(c =>
          (c.firstName || "").toLowerCase().includes(filter.toLowerCase())
        );
      }

      if (!filtered.length) {
        customerList.innerHTML = "<p>No results found.</p>";
        return;
      }

      customerList.innerHTML = filtered.map((c, i) => {
        let bmi = "-";
        if (c.height && c.weight) {
          let h = parseFloat(c.height) / 100;
          let w = parseFloat(c.weight);
          if (h > 0) bmi = (w / (h * h)).toFixed(1);
        }

        let progress = c.progress || "0%";

        return `
          <div class="customer-card">
            <h3>${c.firstName || ""} ${c.lastName || ""}</h3>
            <p>Age: ${c.age || "-"}</p>
            <p>Height: ${c.height || "-"} cm</p>
            <p>Weight: ${c.weight || "-"} kg</p>
            <p><b>BMI:</b> ${bmi}</p>
            <p><b>Progress:</b> ${progress} <a href="#" onclick="editProgress(${i}); return false;">[edit]</a></p>
            <button onclick="deleteCustomer(${i})">🗑️ Delete</button>
          </div>
        `;
      }).join("");
    } catch (err) {
      console.error(err);
      customerList.innerHTML = `<p>❌ Error loading data. ${err.message}</p>`;
    }
  }

  renderCustomers();

  searchBox.addEventListener("input", (e) => {
    renderCustomers(e.target.value);
  });
}
