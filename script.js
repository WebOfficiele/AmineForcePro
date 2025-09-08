// script.js full logic including saving all new fields, BMI calculation with weight only, 
// progress editable only from admin, search, delete, and render all fields in dashboard.
/************ CONFIG ************/
const BIN_ID   = "68bb36c1d0ea881f4073162c";
const API_KEY  = "$2a$10$FpSddJCx8IVth3u50X7kdeQbeDoXRYHcgCKQN9iqERYCEdut5mhqa";
const BASE_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;
/********************************/

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
      weight:    document.getElementById("weight").value,
      muscle:    document.getElementById("muscle").value,
      fat:       document.getElementById("fat").value,
      waist:     document.getElementById("waist").value,
      water:     document.getElementById("water").value,
      goal:      document.getElementById("goal").value
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
          let bmi = "-";
          if (c.height && c.weight) {
            let h = parseFloat(c.height) / 100;
            let w = parseFloat(c.weight);
            if (h > 0 && w) bmi = (w / (h * h)).toFixed(1);
          }
          let progress = c.progress || "0%";
          return `
            <div class="customer-card">
              <h3>${c.firstName || ""} ${c.lastName || ""}</h3>
              <p>Age: ${c.age || "-"}</p>
              <p>Height: ${c.height || "-"} cm</p>
              <p>Weight: ${c.weight || "-"} kg</p>
              <p>Muscle Mass: ${c.muscle || "-"} kg</p>
              <p>Body Fat: ${c.fat || "-"}%</p>
              <p>Waist: ${c.waist || "-"} cm</p>
              <p>Water: ${c.water || "-"}%</p>
              <p>Goal: ${c.goal || "-"}</p>
              <p><b>BMI:</b> ${bmi}</p>
              <p><b>Progress:</b> ${progress} <a href="#" onclick="editProgress(${i}); return false;">[edit]</a></p>
              <button onclick="deleteCustomer(${i})">🗑️ Delete</button>
            </div>
          `;
        }).join("");
      }

      render();

      window.deleteCustomer = async function(index) {
        if (confirm("Are you sure you want to delete this customer?")) {
          customers.splice(index, 1);
          await saveCustomers(customers);
          render();
        }
      };

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

/******** SEARCH FEATURE ********/
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
          if (h > 0 && w) bmi = (w / (h * h)).toFixed(1);
        }
        let progress = c.progress || "0%";
        return `
          <div class="customer-card">
            <h3>${c.firstName || ""} ${c.lastName || ""}</h3>
            <p>Age: ${c.age || "-"}</p>
            <p>Height: ${c.height || "-"} cm</p>
            <p>Weight: ${c.weight || "-"} kg</p>
            <p>Muscle Mass: ${c.muscle || "-"} kg</p>
            <p>Body Fat: ${c.fat || "-"}%</p>
            <p>Waist: ${c.waist || "-"} cm</p>
            <p>Water: ${c.water || "-"}%</p>
            <p>Goal: ${c.goal || "-"}</p>
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

