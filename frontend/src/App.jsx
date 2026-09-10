import React, {
  useEffect,
  useMemo,
  useState
} from "react";

import {
  Activity,
  ArrowUpRight,
  Bot,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  Database,
  Download,
  Edit3,
  LayoutDashboard,
  Menu,
  Package,
  Plus,
  RefreshCw,
  Save,
  Search,
  Settings,
  Trash2,
  UserPlus,
  Users,
  X,
  Zap,
} from "lucide-react";

import "./index.css";
import { askAgent, checkBackend } from "./api";

const STORAGE_KEY = "opsai_business_data";

const emptyData = {
  sales: [],
  inventory: [],
  tasks: [],
  team: [],
};


const defaultSettings = {
  companyName: "My Business",
  currency: "₹",
  lowStockLimit: 5,
  notifications: true,
};


function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      return {
        ...emptyData,
        ...JSON.parse(saved),
      };
    }
  } catch (error) {
    console.error(error);
  }

  return emptyData;
}


function App() {

  const [data, setData] = useState(loadData);

  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem("opsai_settings");

      return saved
        ? { ...defaultSettings, ...JSON.parse(saved) }
        : defaultSettings;

    } catch {
      return defaultSettings;
    }
  });


  const [page, setPage] = useState("Dashboard");

  const [mobileMenu, setMobileMenu] = useState(false);

  const [backendOnline, setBackendOnline] = useState(false);

  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);

  const [modalType, setModalType] = useState("");

  const [editingItem, setEditingItem] = useState(null);

  const [agentQuestion, setAgentQuestion] = useState("");

  const [agentAnswer, setAgentAnswer] = useState("");

  const [agentLoading, setAgentLoading] = useState(false);


  useEffect(() => {

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(data)
    );

  }, [data]);


  useEffect(() => {

    localStorage.setItem(
      "opsai_settings",
      JSON.stringify(settings)
    );

  }, [settings]);


  useEffect(() => {

    checkBackend().then((result) => {
      setBackendOnline(Boolean(result));
    });

  }, []);


  const totalSales = useMemo(() => {

    return data.sales.reduce(
      (total, sale) =>
        total + Number(sale.amount || 0),
      0
    );

  }, [data.sales]);


  const lowStock = useMemo(() => {

    return data.inventory.filter(
      (item) =>
        Number(item.stock) <=
        Number(item.minimum || settings.lowStockLimit)
    );

  }, [data.inventory, settings.lowStockLimit]);


  const pendingTasks = data.tasks.filter(
    (task) => task.status !== "Completed"
  );


  const navigation = [
    {
      name: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Sales",
      icon: CircleDollarSign,
    },
    {
      name: "Inventory",
      icon: Package,
    },
    {
      name: "Tasks",
      icon: ClipboardList,
    },
    {
      name: "Team",
      icon: Users,
    },
    {
      name: "AI Agent",
      icon: Bot,
    },
    {
      name: "Settings",
      icon: Settings,
    },
  ];


  function openAdd(type) {

    setModalType(type);
    setEditingItem(null);
    setShowModal(true);

  }


  function openEdit(type, item) {

    setModalType(type);
    setEditingItem(item);
    setShowModal(true);

  }


  function saveItem(item) {

    setData((previous) => {

      const key = modalType.toLowerCase();

      const list = previous[key] || [];

      if (editingItem) {

        return {
          ...previous,

          [key]: list.map((existing) =>
            existing.id === editingItem.id
              ? item
              : existing
          ),
        };

      }

      return {
        ...previous,

        [key]: [
          ...list,
          {
            ...item,
            id: Date.now(),
          },
        ],
      };

    });

    setShowModal(false);

  }


  function deleteItem(type, id) {

    const key = type.toLowerCase();

    setData((previous) => ({
      ...previous,
      [key]: previous[key].filter(
        (item) => item.id !== id
      ),
    }));

  }


  function completeTask(id) {

    setData((previous) => ({
      ...previous,

      tasks: previous.tasks.map((task) =>
        task.id === id
          ? {
              ...task,
              status: "Completed",
            }
          : task
      ),
    }));

  }


  function clearAllData() {

    const confirmed = window.confirm(
      "Are you sure you want to delete all business data?"
    );

    if (!confirmed) return;

    setData(emptyData);

    localStorage.removeItem(STORAGE_KEY);

  }


  async function runAgent() {

    if (!agentQuestion.trim()) return;

    setAgentLoading(true);
    setAgentAnswer("");

    try {

      const result = await askAgent(
        agentQuestion,
        data
      );

      setAgentAnswer(
        result.answer ||
        result.message ||
        "No answer received."
      );

    } catch (error) {

      console.error(error);

      setAgentAnswer(
        "AI Agent could not connect to the backend. " +
        "Please make sure your FastAPI server is running."
      );

    } finally {

      setAgentLoading(false);

    }

  }


  function exportData() {

    const file = new Blob(
      [
        JSON.stringify(
          {
            company: settings.companyName,
            data,
          },
          null,
          2
        ),
      ],
      {
        type: "application/json",
      }
    );

    const url = URL.createObjectURL(file);

    const link = document.createElement("a");

    link.href = url;

    link.download = "opsai-business-data.json";

    link.click();

    URL.revokeObjectURL(url);

  }


  return (
    <div className="app-shell">

      {/* SIDEBAR */}

      <aside
        className={`sidebar ${
          mobileMenu ? "sidebar-open" : ""
        }`}
      >

        <div className="brand">

          <div className="brand-logo">
            <Zap size={22} />
          </div>

          <div>
            <h2>OPSAI</h2>
            <span>Business Agent</span>
          </div>

        </div>


        <nav>

          {navigation.map((item) => {

            const Icon = item.icon;

            return (
              <button
                key={item.name}
                className={
                  page === item.name
                    ? "nav-item active"
                    : "nav-item"
                }
                onClick={() => {
                  setPage(item.name);
                  setMobileMenu(false);
                }}
              >

                <Icon size={19} />

                <span>{item.name}</span>

              </button>
            );

          })}

        </nav>


        <div className="sidebar-bottom">

          <div className="backend-card">

            <div className="status-dot"></div>

            <div>

              <strong>
                {backendOnline
                  ? "AI Online"
                  : "Backend Offline"}
              </strong>

              <small>
                {backendOnline
                  ? "System connected"
                  : "Check backend"}
              </small>

            </div>

          </div>

        </div>

      </aside>


      {/* MOBILE OVERLAY */}

      {mobileMenu && (
        <div
          className="mobile-overlay"
          onClick={() => setMobileMenu(false)}
        />
      )}


      {/* MAIN */}

      <main className="main-content">

        <header className="topbar">

          <button
            className="mobile-menu"
            onClick={() =>
              setMobileMenu(!mobileMenu)
            }
          >
            {mobileMenu ? (
              <X />
            ) : (
              <Menu />
            )}
          </button>


          <div className="topbar-title">

            <span>WORKSPACE</span>

            <h1>{page}</h1>

          </div>


          <div className="topbar-actions">

            <div className="company-name">
              {settings.companyName}
            </div>

            <button
              className="icon-button"
              onClick={() =>
                setPage("Settings")
              }
            >
              <Settings size={19} />
            </button>

          </div>

        </header>


        {/* DASHBOARD */}

        {page === "Dashboard" && (

          <Dashboard
            data={data}
            totalSales={totalSales}
            lowStock={lowStock}
            pendingTasks={pendingTasks}
            setPage={setPage}
            openAdd={openAdd}
            settings={settings}
          />

        )}


        {/* SALES */}

        {page === "Sales" && (

          <SalesPage
            sales={data.sales}
            search={search}
            setSearch={setSearch}
            openAdd={() => openAdd("Sales")}
            openEdit={(item) =>
              openEdit("Sales", item)
            }
            deleteItem={(id) =>
              deleteItem("Sales", id)
            }
            currency={settings.currency}
          />

        )}


        {/* INVENTORY */}

        {page === "Inventory" && (

          <InventoryPage
            inventory={data.inventory}
            search={search}
            setSearch={setSearch}
            openAdd={() =>
              openAdd("Inventory")
            }
            openEdit={(item) =>
              openEdit("Inventory", item)
            }
            deleteItem={(id) =>
              deleteItem("Inventory", id)
            }
            lowStock={lowStock}
          />

        )}


        {/* TASKS */}

        {page === "Tasks" && (

          <TasksPage
            tasks={data.tasks}
            search={search}
            setSearch={setSearch}
            openAdd={() =>
              openAdd("Tasks")
            }
            openEdit={(item) =>
              openEdit("Tasks", item)
            }
            deleteItem={(id) =>
              deleteItem("Tasks", id)
            }
            completeTask={completeTask}
          />

        )}


        {/* TEAM */}

        {page === "Team" && (

          <TeamPage
            team={data.team}
            search={search}
            setSearch={setSearch}
            openAdd={() =>
              openAdd("Team")
            }
            openEdit={(item) =>
              openEdit("Team", item)
            }
            deleteItem={(id) =>
              deleteItem("Team", id)
            }
          />

        )}


        {/* AI AGENT */}

        {page === "AI Agent" && (

          <AgentPage
            question={agentQuestion}
            setQuestion={setAgentQuestion}
            answer={agentAnswer}
            loading={agentLoading}
            runAgent={runAgent}
            backendOnline={backendOnline}
            data={data}
          />

        )}


        {/* SETTINGS */}

        {page === "Settings" && (

          <SettingsPage
            settings={settings}
            setSettings={setSettings}
            exportData={exportData}
            clearAllData={clearAllData}
            data={data}
          />

        )}

      </main>


      {/* MODAL */}

      {showModal && (

        <DataModal
          type={modalType}
          item={editingItem}
          onClose={() =>
            setShowModal(false)
          }
          onSave={saveItem}
        />

      )}

    </div>
  );
}


/* =====================================================
   DASHBOARD
===================================================== */

function Dashboard({
  data,
  totalSales,
  lowStock,
  pendingTasks,
  setPage,
  openAdd,
  settings,
}) {

  return (
    <section className="page">

      <div className="hero">

        <div>

          <span className="eyebrow">
            <Activity size={15} />
            OPERATIONS INTELLIGENCE
          </span>

          <h2>
            Run your business
            <br />
            <strong>smarter with AI.</strong>
          </h2>

          <p>
            Manage sales, inventory, tasks and
            your team from one intelligent workspace.
          </p>

        </div>


        <button
          className="primary-button"
          onClick={() => setPage("AI Agent")}
        >
          <Bot size={18} />
          Ask AI Agent
        </button>

      </div>


      <div className="stats-grid">

        <StatCard
          title="Total Sales"
          value={`${settings.currency}${totalSales.toLocaleString()}`}
          icon={CircleDollarSign}
          subtitle={`${data.sales.length} transactions`}
        />

        <StatCard
          title="Inventory Items"
          value={data.inventory.length}
          icon={Package}
          subtitle={`${lowStock.length} low stock`}
        />

        <StatCard
          title="Pending Tasks"
          value={pendingTasks.length}
          icon={ClipboardList}
          subtitle="Needs attention"
        />

        <StatCard
          title="Team Members"
          value={data.team.length}
          icon={Users}
          subtitle="Active workspace"
        />

      </div>


      <div className="dashboard-grid">

        <div className="panel">

          <div className="panel-header">

            <div>
              <span className="panel-label">
                QUICK ACTIONS
              </span>

              <h3>Manage operations</h3>
            </div>

          </div>


          <div className="quick-grid">

            <QuickAction
              icon={CircleDollarSign}
              title="Add Sale"
              description="Record a new sale"
              onClick={() => openAdd("Sales")}
            />

            <QuickAction
              icon={Package}
              title="Add Product"
              description="Update inventory"
              onClick={() =>
                openAdd("Inventory")
              }
            />

            <QuickAction
              icon={ClipboardList}
              title="Create Task"
              description="Assign work"
              onClick={() =>
                openAdd("Tasks")
              }
            />

            <QuickAction
              icon={UserPlus}
              title="Add Team"
              description="Add member"
              onClick={() =>
                openAdd("Team")
              }
            />

          </div>

        </div>


        <div className="panel">

          <div className="panel-header">

            <div>
              <span className="panel-label">
                INVENTORY ALERT
              </span>

              <h3>Low stock</h3>
            </div>

            <button
              className="text-button"
              onClick={() =>
                setPage("Inventory")
              }
            >
              View all
              <ChevronRight size={15} />
            </button>

          </div>


          {lowStock.length === 0 ? (

            <EmptyState
              icon={CheckCircle2}
              text="All inventory levels look good."
            />

          ) : (

            <div className="alert-list">

              {lowStock.slice(0, 5).map((item) => (

                <div
                  className="alert-item"
                  key={item.id}
                >

                  <div className="alert-icon">
                    <Package size={18} />
                  </div>

                  <div>

                    <strong>{item.product}</strong>

                    <span>
                      Only {item.stock} units left
                    </span>

                  </div>

                  <span className="danger-badge">
                    LOW
                  </span>

                </div>

              ))}

            </div>

          )}

        </div>

      </div>


      <div className="panel">

        <div className="panel-header">

          <div>
            <span className="panel-label">
              RECENT SALES
            </span>

            <h3>Latest transactions</h3>
          </div>

          <button
            className="text-button"
            onClick={() => setPage("Sales")}
          >
            View sales
            <ChevronRight size={15} />
          </button>

        </div>


        {data.sales.length === 0 ? (

          <EmptyState
            icon={CircleDollarSign}
            text="No sales added yet."
          />

        ) : (

          <div className="table-wrapper">

            <table>

              <thead>
                <tr>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Amount</th>
                  <th>Date</th>
                </tr>
              </thead>

              <tbody>

                {data.sales
                  .slice(-5)
                  .reverse()
                  .map((sale) => (

                    <tr key={sale.id}>

                      <td>
                        <strong>
                          {sale.product}
                        </strong>
                      </td>

                      <td>{sale.quantity}</td>

                      <td>
                        {settings.currency}
                        {Number(
                          sale.amount || 0
                        ).toLocaleString()}
                      </td>

                      <td>{sale.date}</td>

                    </tr>

                  ))}

              </tbody>

            </table>

          </div>

        )}

      </div>

    </section>
  );
}


/* =====================================================
   SALES PAGE
===================================================== */

function SalesPage({
  sales,
  search,
  setSearch,
  openAdd,
  openEdit,
  deleteItem,
  currency,
}) {

  const filtered = sales.filter(
    (sale) =>
      sale.product
        ?.toLowerCase()
        .includes(search.toLowerCase())
  );


  return (
    <section className="page">

      <PageHeader
        label="SALES MANAGEMENT"
        title="Sales"
        description="Record and manage your business transactions."
        buttonText="Add Sale"
        onClick={openAdd}
      />


      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search sales..."
      />


      <div className="panel">

        {filtered.length === 0 ? (

          <EmptyState
            icon={CircleDollarSign}
            text="No sales found. Add your first sale."
          />

        ) : (

          <div className="table-wrapper">

            <table>

              <thead>
                <tr>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>

                {filtered.map((sale) => (

                  <tr key={sale.id}>

                    <td>
                      <strong>
                        {sale.product}
                      </strong>
                    </td>

                    <td>{sale.quantity}</td>

                    <td>
                      {currency}
                      {Number(
                        sale.amount || 0
                      ).toLocaleString()}
                    </td>

                    <td>{sale.date}</td>

                    <td>

                      <div className="row-actions">

                        <button
                          className="small-button"
                          onClick={() =>
                            openEdit(sale)
                          }
                        >
                          <Edit3 size={15} />
                        </button>

                        <button
                          className="small-button danger"
                          onClick={() =>
                            deleteItem(sale.id)
                          }
                        >
                          <Trash2 size={15} />
                        </button>

                      </div>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </div>

    </section>
  );
}


/* =====================================================
   INVENTORY PAGE
===================================================== */

function InventoryPage({
  inventory,
  search,
  setSearch,
  openAdd,
  openEdit,
  deleteItem,
  lowStock,
}) {

  const filtered = inventory.filter(
    (item) =>
      item.product
        ?.toLowerCase()
        .includes(search.toLowerCase())
  );


  return (
    <section className="page">

      <PageHeader
        label="INVENTORY MANAGEMENT"
        title="Inventory"
        description="Monitor products and stock levels."
        buttonText="Add Product"
        onClick={openAdd}
      />


      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search inventory..."
      />


      <div className="panel">

        {filtered.length === 0 ? (

          <EmptyState
            icon={Package}
            text="No products found."
          />

        ) : (

          <div className="table-wrapper">

            <table>

              <thead>

                <tr>
                  <th>Product</th>
                  <th>Stock</th>
                  <th>Minimum</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>

              </thead>


              <tbody>

                {filtered.map((item) => {

                  const isLow =
                    Number(item.stock) <=
                    Number(item.minimum || 5);

                  return (
                    <tr key={item.id}>

                      <td>
                        <strong>
                          {item.product}
                        </strong>
                      </td>

                      <td>
                        {item.stock}
                      </td>

                      <td>
                        {item.minimum}
                      </td>

                      <td>

                        {isLow ? (
                          <span className="danger-badge">
                            LOW STOCK
                          </span>
                        ) : (
                          <span className="success-badge">
                            IN STOCK
                          </span>
                        )}

                      </td>

                      <td>

                        <div className="row-actions">

                          <button
                            className="small-button"
                            onClick={() =>
                              openEdit(item)
                            }
                          >
                            <Edit3 size={15} />
                          </button>

                          <button
                            className="small-button danger"
                            onClick={() =>
                              deleteItem(item.id)
                            }
                          >
                            <Trash2 size={15} />
                          </button>

                        </div>

                      </td>

                    </tr>
                  );

                })}

              </tbody>

            </table>

          </div>

        )}

      </div>

    </section>
  );
}


/* =====================================================
   TASKS PAGE
===================================================== */

function TasksPage({
  tasks,
  search,
  setSearch,
  openAdd,
  openEdit,
  deleteItem,
  completeTask,
}) {

  const filtered = tasks.filter(
    (task) =>
      task.title
        ?.toLowerCase()
        .includes(search.toLowerCase())
  );


  return (
    <section className="page">

      <PageHeader
        label="TASK MANAGEMENT"
        title="Tasks"
        description="Track and complete your business operations."
        buttonText="Create Task"
        onClick={openAdd}
      />


      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search tasks..."
      />


      <div className="task-list">

        {filtered.length === 0 ? (

          <div className="panel">

            <EmptyState
              icon={ClipboardList}
              text="No tasks found."
            />

          </div>

        ) : (

          filtered.map((task) => (

            <div
              className={`task-card ${
                task.status === "Completed"
                  ? "task-completed"
                  : ""
              }`}
              key={task.id}
            >

              <div className="task-check">

                <button
                  onClick={() =>
                    completeTask(task.id)
                  }
                >

                  {task.status ===
                  "Completed" ? (
                    <CheckCircle2 />
                  ) : (
                    <Check />
                  )}

                </button>

              </div>


              <div className="task-info">

                <h3>{task.title}</h3>

                <div className="task-meta">

                  <span>
                    Priority: {task.priority}
                  </span>

                  <span>
                    Assigned to:{" "}
                    {task.assignee || "Unassigned"}
                  </span>

                  <span>
                    Due: {task.dueDate || "No date"}
                  </span>

                </div>

              </div>


              <span
                className={
                  task.status === "Completed"
                    ? "success-badge"
                    : "warning-badge"
                }
              >
                {task.status}
              </span>


              <div className="row-actions">

                <button
                  className="small-button"
                  onClick={() =>
                    openEdit(task)
                  }
                >
                  <Edit3 size={15} />
                </button>

                <button
                  className="small-button danger"
                  onClick={() =>
                    deleteItem(task.id)
                  }
                >
                  <Trash2 size={15} />
                </button>

              </div>

            </div>

          ))

        )}

      </div>

    </section>
  );
}


/* =====================================================
   TEAM PAGE
===================================================== */

function TeamPage({
  team,
  search,
  setSearch,
  openAdd,
  openEdit,
  deleteItem,
}) {

  const filtered = team.filter(
    (member) =>
      member.name
        ?.toLowerCase()
        .includes(search.toLowerCase())
  );


  return (
    <section className="page">

      <PageHeader
        label="TEAM MANAGEMENT"
        title="Team"
        description="Manage your business team members."
        buttonText="Add Member"
        onClick={openAdd}
      />


      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search team members..."
      />


      <div className="team-grid">

        {filtered.length === 0 ? (

          <div className="panel">

            <EmptyState
              icon={Users}
              text="No team members added yet."
            />

          </div>

        ) : (

          filtered.map((member) => (

            <div
              className="team-card"
              key={member.id}
            >

              <div className="avatar">
                {member.name
                  ?.charAt(0)
                  .toUpperCase()}
              </div>

              <div className="team-info">

                <h3>{member.name}</h3>

                <p>{member.role}</p>

                <span>
                  {member.email}
                </span>

              </div>


              <div className="team-card-actions">

                <button
                  className="small-button"
                  onClick={() =>
                    openEdit(member)
                  }
                >
                  <Edit3 size={15} />
                </button>

                <button
                  className="small-button danger"
                  onClick={() =>
                    deleteItem(member.id)
                  }
                >
                  <Trash2 size={15} />
                </button>

              </div>

            </div>

          ))

        )}

      </div>

    </section>
  );
}


/* =====================================================
   AI AGENT
===================================================== */

function AgentPage({
  question,
  setQuestion,
  answer,
  loading,
  runAgent,
  backendOnline,
  data,
}) {

  const suggestions = [
    "Which products need restocking?",
    "Analyze my sales performance.",
    "What tasks are still pending?",
    "Give me a summary of my business.",
    "Who is currently on my team?",
  ];


  return (
    <section className="page">

      <div className="agent-hero">

        <div className="agent-icon">
          <Bot size={34} />
        </div>

        <span className="eyebrow">
          AI OPERATIONS AGENT
        </span>

        <h2>
          Ask your business
          <br />
          <strong>anything.</strong>
        </h2>

        <p>
          OPSAI analyzes the sales, inventory,
          tasks and team data you entered.
        </p>

      </div>


      <div className="agent-status">

        <div
          className={
            backendOnline
              ? "online-dot"
              : "offline-dot"
          }
        />

        {backendOnline
          ? "AI backend connected"
          : "Backend not connected"}

        <span>
          • {data.sales.length} sales
          • {data.inventory.length} products
          • {data.tasks.length} tasks
          • {data.team.length} team members
        </span>

      </div>


      <div className="agent-box">

        <textarea
          value={question}
          onChange={(event) =>
            setQuestion(event.target.value)
          }
          placeholder="Ask something like: Which products should I restock?"
          rows={4}
        />


        <div className="agent-box-bottom">

          <span>
            AI uses your current business data
          </span>

          <button
            className="primary-button"
            onClick={runAgent}
            disabled={loading}
          >

            {loading ? (
              <>
                <RefreshCw
                  size={17}
                  className="spin"
                />
                Thinking...
              </>
            ) : (
              <>
                <Bot size={17} />
                Ask Agent
              </>
            )}

          </button>

        </div>

      </div>


      <div className="suggestions">

        <span>TRY ASKING</span>

        <div>

          {suggestions.map((text) => (

            <button
              key={text}
              onClick={() =>
                setQuestion(text)
              }
            >
              {text}
            </button>

          ))}

        </div>

      </div>


      {answer && (

        <div className="agent-response">

          <div className="response-header">

            <Bot size={19} />

            <strong>
              OPSAI Response
            </strong>

          </div>

          <div className="response-content">
            {answer}
          </div>

        </div>

      )}

    </section>
  );
}


/* =====================================================
   SETTINGS
===================================================== */

function SettingsPage({
  settings,
  setSettings,
  exportData,
  clearAllData,
  data,
}) {

  function update(field, value) {

    setSettings((previous) => ({
      ...previous,
      [field]: value,
    }));

  }


  return (
    <section className="page">

      <PageHeader
        label="SYSTEM CONFIGURATION"
        title="Settings"
        description="Configure your OPSAI workspace."
      />


      <div className="settings-grid">

        <div className="panel">

          <div className="panel-header">

            <div>

              <span className="panel-label">
                BUSINESS
              </span>

              <h3>Business settings</h3>

            </div>

          </div>


          <div className="form-group">

            <label>
              Business name
            </label>

            <input
              value={settings.companyName}
              onChange={(event) =>
                update(
                  "companyName",
                  event.target.value
                )
              }
            />

          </div>


          <div className="form-group">

            <label>
              Currency symbol
            </label>

            <input
              value={settings.currency}
              onChange={(event) =>
                update(
                  "currency",
                  event.target.value
                )
              }
              placeholder="₹"
            />

          </div>


          <div className="form-group">

            <label>
              Low stock alert limit
            </label>

            <input
              type="number"
              min="0"
              value={settings.lowStockLimit}
              onChange={(event) =>
                update(
                  "lowStockLimit",
                  Number(event.target.value)
                )
              }
            />

          </div>


          <div className="setting-row">

            <div>

              <strong>
                Notifications
              </strong>

              <span>
                Show operational alerts
              </span>

            </div>

            <button
              className={
                settings.notifications
                  ? "toggle on"
                  : "toggle"
              }
              onClick={() =>
                update(
                  "notifications",
                  !settings.notifications
                )
              }
            >

              <span />

            </button>

          </div>

        </div>


        <div className="panel">

          <div className="panel-header">

            <div>

              <span className="panel-label">
                DATA
              </span>

              <h3>Workspace data</h3>

            </div>

          </div>


          <div className="data-summary">

            <DataRow
              icon={CircleDollarSign}
              label="Sales"
              value={data.sales.length}
            />

            <DataRow
              icon={Package}
              label="Inventory"
              value={data.inventory.length}
            />

            <DataRow
              icon={ClipboardList}
              label="Tasks"
              value={data.tasks.length}
            />

            <DataRow
              icon={Users}
              label="Team"
              value={data.team.length}
            />

          </div>


          <button
            className="secondary-button full"
            onClick={exportData}
          >
            <Download size={17} />
            Export Business Data
          </button>


          <button
            className="danger-button full"
            onClick={clearAllData}
          >
            <Trash2 size={17} />
            Clear All Data
          </button>

        </div>

      </div>


      <div className="save-notice">

        <Save size={18} />

        <div>

          <strong>
            Settings are saved automatically
          </strong>

          <span>
            Your data is stored locally in this
            browser.
          </span>

        </div>

      </div>

    </section>
  );
}


/* =====================================================
   DATA MODAL
===================================================== */

function DataModal({
  type,
  item,
  onClose,
  onSave,
}) {

  const [form, setForm] = useState(
    getInitialForm(type, item)
  );


  function change(field, value) {

    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

  }


  function submit(event) {

    event.preventDefault();

    onSave({
      ...form,
      ...(item?.id
        ? { id: item.id }
        : {}),
    });

  }


  return (
    <div className="modal-overlay">

      <div className="modal">

        <div className="modal-header">

          <div>

            <span className="panel-label">
              {item ? "EDIT" : "NEW"}
            </span>

            <h2>
              {item
                ? `Edit ${type}`
                : `Add ${type}`}
            </h2>

          </div>

          <button
            className="icon-button"
            onClick={onClose}
          >
            <X size={19} />
          </button>

        </div>


        <form onSubmit={submit}>

          {type === "Sales" && (
            <>
              <FormField
                label="Product"
                value={form.product}
                onChange={(value) =>
                  change("product", value)
                }
                required
              />

              <FormField
                label="Quantity"
                type="number"
                value={form.quantity}
                onChange={(value) =>
                  change("quantity", value)
                }
                required
              />

              <FormField
                label="Amount"
                type="number"
                value={form.amount}
                onChange={(value) =>
                  change("amount", value)
                }
                required
              />

              <FormField
                label="Date"
                type="date"
                value={form.date}
                onChange={(value) =>
                  change("date", value)
                }
                required
              />
            </>
          )}


          {type === "Inventory" && (
            <>
              <FormField
                label="Product"
                value={form.product}
                onChange={(value) =>
                  change("product", value)
                }
                required
              />

              <FormField
                label="Current stock"
                type="number"
                value={form.stock}
                onChange={(value) =>
                  change("stock", value)
                }
                required
              />

              <FormField
                label="Minimum stock"
                type="number"
                value={form.minimum}
                onChange={(value) =>
                  change("minimum", value)
                }
                required
              />
            </>
          )}


          {type === "Tasks" && (
            <>
              <FormField
                label="Task title"
                value={form.title}
                onChange={(value) =>
                  change("title", value)
                }
                required
              />

              <div className="form-group">

                <label>Priority</label>

                <select
                  value={form.priority}
                  onChange={(event) =>
                    change(
                      "priority",
                      event.target.value
                    )
                  }
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>

              </div>


              <FormField
                label="Assignee"
                value={form.assignee}
                onChange={(value) =>
                  change("assignee", value)
                }
              />


              <FormField
                label="Due date"
                type="date"
                value={form.dueDate}
                onChange={(value) =>
                  change("dueDate", value)
                }
              />

            </>
          )}


          {type === "Team" && (
            <>
              <FormField
                label="Name"
                value={form.name}
                onChange={(value) =>
                  change("name", value)
                }
                required
              />

              <FormField
                label="Role"
                value={form.role}
                onChange={(value) =>
                  change("role", value)
                }
                required
              />

              <FormField
                label="Email"
                type="email"
                value={form.email}
                onChange={(value) =>
                  change("email", value)
                }
              />

            </>
          )}


          <div className="modal-actions">

            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="primary-button"
            >
              <Save size={17} />
              Save
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}


/* =====================================================
   HELPERS
===================================================== */

function getInitialForm(type, item) {

  if (item) return { ...item };


  if (type === "Sales") {

    return {
      product: "",
      quantity: 1,
      amount: "",
      date: new Date()
        .toISOString()
        .slice(0, 10),
    };

  }


  if (type === "Inventory") {

    return {
      product: "",
      stock: 0,
      minimum: 5,
    };

  }


  if (type === "Tasks") {

    return {
      title: "",
      priority: "Medium",
      assignee: "",
      dueDate: "",
      status: "Pending",
    };

  }


  if (type === "Team") {

    return {
      name: "",
      role: "",
      email: "",
    };

  }


  return {};
}


function FormField({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}) {

  return (
    <div className="form-group">

      <label>{label}</label>

      <input
        type={type}
        value={value ?? ""}
        required={required}
        onChange={(event) =>
          onChange(event.target.value)
        }
      />

    </div>
  );
}


function PageHeader({
  label,
  title,
  description,
  buttonText,
  onClick,
}) {

  return (
    <div className="page-header">

      <div>

        <span className="eyebrow">
          {label}
        </span>

        <h2>{title}</h2>

        <p>{description}</p>

      </div>

      {buttonText && (
        <button
          className="primary-button"
          onClick={onClick}
        >
          <Plus size={18} />
          {buttonText}
        </button>
      )}

    </div>
  );
}


function SearchBar({
  value,
  onChange,
  placeholder,
}) {

  return (
    <div className="search-bar">

      <Search size={18} />

      <input
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
      />

      {value && (
        <button
          onClick={() => onChange("")}
        >
          <X size={16} />
        </button>
      )}

    </div>
  );
}


function StatCard({
  title,
  value,
  icon: Icon,
  subtitle,
}) {

  return (
    <div className="stat-card">

      <div className="stat-top">

        <div className="stat-icon">
          <Icon size={20} />
        </div>

        <ArrowUpRight size={16} />

      </div>

      <span>{title}</span>

      <strong>{value}</strong>

      <small>{subtitle}</small>

    </div>
  );
}


function QuickAction({
  icon: Icon,
  title,
  description,
  onClick,
}) {

  return (
    <button
      className="quick-action"
      onClick={onClick}
    >

      <div className="quick-icon">
        <Icon size={19} />
      </div>

      <div>

        <strong>{title}</strong>

        <span>{description}</span>

      </div>

      <ChevronRight size={16} />

    </button>
  );
}


function EmptyState({
  icon: Icon,
  text,
}) {

  return (
    <div className="empty-state">

      <Icon size={30} />

      <p>{text}</p>

    </div>
  );
}


function DataRow({
  icon: Icon,
  label,
  value,
}) {

  return (
    <div className="data-row">

      <div className="data-row-icon">
        <Icon size={17} />
      </div>

      <span>{label}</span>

      <strong>{value}</strong>

    </div>
  );
}


export default App;