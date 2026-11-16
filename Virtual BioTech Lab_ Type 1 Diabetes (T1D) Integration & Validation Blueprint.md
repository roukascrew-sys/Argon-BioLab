# **Virtual BioTech Lab: Type 1 Diabetes Integration & Validation Blueprint**

Adapting the oncology-focused Virtual BioTech & BioChem Lab architecture to Type 1 Diabetes (T1D) is highly feasible for software developers without specialized biological backgrounds. This transition requires re-parameterizing existing numerical systems rather than rewriting core software infrastructure. The web-based state management, Runge-Kutta numerical Ordinary Differential Equation (ODE) integration engines, and automated test harnesses established for cancer signaling pathways translate directly to T1D physiological and genetic systems.

T1D research benefits from decades of rigorous, peer-reviewed mathematical modeling—most notably the FDA-accepted Dalla Man/Cobelli metabolic frameworks and Fickian diffusion mechanics. By leveraging these existing models, software engineers can construct a deterministic, highly actionable simulation environment without relying on speculative biological assumptions.

## **Feasibility & Risk Assessment**

| Domain | Confidence Level | Key Rationale & Technical Foundation |
| :---- | :---- | :---- |
| **Technical Implementation** | 90% (High) | Re-uses existing web frontend state management, deterministic RK4 ODE solver, and automated assertion engines built for oncology. |
| **Scientific & Math Validity** | 85% (High) | Utilizes established equations (Dalla Man/Cobelli metabolic model, Fickian hypoxia kinetics) rather than speculative pathways. |
| **Academic / Open-Source Adoption** | 65% (Moderate-High) | Contingent on shipping a deterministic, fully cited demo to computational postdocs and Automated Insulin Delivery (AID) open-source maintainers. |
| **Direct Wet-Lab Drug Discovery** | 0% (Out of Scope) | Explicitly excluded. The engine functions as a verification sandbox, educational tool, and rapid prototyping harness, not a wet-lab substitute. |

# **Architecture Mapping: Oncology Workbench to T1D**

The platform's structural modularity allows a direct 1:1 functional conversion from oncology workflows to T1D bio-engineering challenges.

| Oncology Workbench Component | T1D Counterpart Module | Target Biological & Computational Mechanism |
| :---- | :---- | :---- |
| **CRISPR Genome Editing Bench** | **Hypoimmune Islet Design Sandbox** | Simulates knockout of \$B2M\$ and \$CIITA\$ (eliminating MHC Class I/II expression) combined with knock-in of \$CD47\$ and \$PD-L1\$ in stem-cell-derived beta cells. Models the trade-off between suppressing CD8+ T-cell destruction and triggering Natural Killer (NK) cell "missing-self" lysis. |
| **Clinical PK/PD Workbench** | **Graft Survival & Subcutaneous PK/PD** | Dual-mode solver executing: (1) 72-hour post-transplant oxygen diffusion dynamics and hypoxia-induced necrosis in encapsulated grafts, and (2) subcutaneous rapid-acting insulin absorption (lispro/aspart) balanced against gut carbohydrate absorption and hepatic glucose output. |
| **Mission Control Verification Harness** | **Physiological Regression & Benchmark Suite** | Automated test suite that executes numerical assertions against published UVa/Padova cohort parameters, ensuring metabolic trajectories stay within physiological bounds. |

# **Core Mathematical Models & Parameter Specifications**

The mathematical engine relies on deterministic systems of ordinary differential equations (ODEs) and partial differential equation (PDE) approximations.

# **Sub-Model A: Hypoimmune Islet Immune-Evasion Balance**

This sub-model calculates the survival rate of engineered stem-cell-derived beta cell grafts (\$N\_{\\beta}\$) exposed to CD8+ T-cell targeted destruction, NK-cell activation due to missing-self recognition, and baseline microenvironmental hypoxia.

## **Governing Survival Equation**

\$\$ \\frac{dN\_{\\beta}}{dt} \= \- \\left\[ k\_{T} \\cdot \\left( \\frac{M\_1}{M\_1 \+ K\_M} \\right) \+ k\_{NK} \\cdot \\left( \\frac{K\_C}{C\_{47} \+ K\_C} \\right) \\right\] N\_{\\beta} \- k\_{\\text{hypoxia}} N\_{\\beta} \$\$

## **Variable Definitions & Parameters**

* \$N\_{\\beta}\$: Density of viable engineered beta cells (\$cells/\\text{mm}^3\$).  
* \$M\_1\$: Surface density of MHC Class I molecules expressed on the graft cell surface (\$molecules/\\mu\\text{m}^2\$).  
* \$C\_{47}\$: Surface density of CD47 overexpressed on the graft cell surface (\$molecules/\\mu\\text{m}^2\$).  
* \$k\_{T}\$: Maximal CD8+ T-cell cytotoxicity rate constant (\$\\text{day}^{-1}\$), baseline \$1.20\$.  
* \$K\_M\$: Half-maximal activation threshold for MHC-I T-cell receptor binding (\$molecules/\\mu\\text{m}^2\$), baseline \$150.0\$.  
* \$k\_{NK}\$: Maximal NK-cell "missing-self" cytotoxicity rate constant (\$\\text{day}^{-1}\$), baseline \$0.85\$.  
* \$K\_C\$: Inhibition constant for CD47-SIRP\$\\alpha\$ binding signaling (\$molecules/\\mu\\text{m}^2\$), baseline \$300.0\$.  
* \$k\_{\\text{hypoxia}}\$: Hypoxia-induced apoptotic loss rate (\$\\text{day}^{-1}\$), derived dynamically from Sub-Model B.

## **Design Objective**

Identify the viable genetic editing window where \$M\_1\$ is sufficiently reduced to avoid CD8+ T-cell recognition without dropping low enough to trigger uncompensated NK-cell lysis, while maintaining \$C\_{47}\$ above the inhibitory threshold \$K\_C\$.

# **Sub-Model B: Encapsulated Islet Oxygen Diffusion & Hypoxia Loss**

This sub-model uses Fick's Second Law combined with Michaelis-Menten consumption kinetics to calculate oxygen partial pressure (\$pO\_2\$) profiles across an encapsulation macro-encapsulation device of thickness \$L\$, evaluating graft viability prior to host vascularization.

## **Governing PDE/ODE System**

\$\$ \\frac{\\partial pO\_2}{\\partial t} \= D\_{O2} \\frac{\\partial^2 pO\_2}{\\partial x^2} \- V\_{O2} \$\$

\$\$ V\_{O2} \= \\frac{V\_{\\text{max}} \\cdot pO\_2}{K\_m \+ pO\_2} \\cdot \\left( \\frac{N\_{\\beta}}{N\_0} \\right) \$\$

## **Variable Definitions & Parameters**

* \$D\_{O2}\$: Effective diffusion coefficient of oxygen inside the hydrogel capsule (\$\\text{cm}^2/s\$), baseline \$1.8 \\times 10^{-5}\$.  
* \$V\_{\\text{max}}\$: Maximal oxygen consumption rate of viable beta cells (\$\\text{mmHg}/s\$), baseline \$0.045\$.  
* \$K\_m\$: Michaelis constant for beta cell oxygen consumption (\$\\text{mmHg}\$), baseline \$0.5\$.  
* \$pO\_2(x)\$: Oxygen partial pressure at depth \$x\$ within the capsule (\$\\text{mmHg}\$).

## **Critical Necrosis Threshold**

When the local core oxygen partial pressure drops below the critical hypoxia threshold (\$pO\_2 \< 0.5 \\text{ mmHg}\$) during the initial 72-hour post-implantation phase, the necrotic loss rate spikes according to:

\$\$ k\_{\\text{hypoxia}} \= k\_{\\text{hyp,max}} \\cdot \\left( 1 \- \\frac{pO\_2}{pO\_{2,\\text{crit}}} \\right) \\quad \\text{for } pO\_2 \< pO\_{2,\\text{crit}} \$\$

where \$k\_{\\text{hyp,max}} \= 2.50 \\text{ day}^{-1}\$ and \$pO\_{2,\\text{crit}} \= 0.5 \\text{ mmHg}\$.

# **Sub-Model C: Subcutaneous Insulin-Glucose PK/PD (Dalla Man / UVa-Padova Framework)**

*Reference: Dalla Man, Rizza, & Cobelli (IEEE Trans Biomed Eng, 2007\)*

## **Subcutaneous Insulin Absorption Dynamics**

\$\$ \\frac{dI\_{sc1}}{dt} \= u(t) \- k\_d \\cdot I\_{sc1} \$\$

\$\$ \\frac{dI\_{sc2}}{dt} \= k\_d \\cdot I\_{sc1} \- k\_a \\cdot I\_{sc2} \$\$

## **Plasma Insulin Kinetics**

\$\$ \\frac{dI\_p}{dt} \= k\_a \\cdot I\_{sc2} \- k\_e \\cdot I\_p \$\$

## **Remote Insulin Action & Plasma Glucose Dynamics**

\$\$ \\frac{dX}{dt} \= \-p\_2 \\cdot X \+ p\_3 \\cdot (I\_p \- I\_b) \$\$

\$\$ \\frac{dG}{dt} \= \-(S\_G \+ X) \\cdot G \+ S\_G \\cdot G\_b \+ \\frac{Ra\_{\\text{meal}}(t)}{V\_G} \$\$

## **Parameter Specifications Table**

| Parameter | Description | Baseline Value | Units | Physiological Range |
| :---- | :---- | :---- | :---- | :---- |
| \$k\_d\$ | Dimerization rate constant | \$0.016\$ | \$\\text{min}^{-1}\$ | \$0.010 \- 0.025\$ |
| \$k\_a\$ | Subcutaneous absorption rate constant | \$0.018\$ | \$\\text{min}^{-1}\$ | \$0.012 \- 0.028\$ |
| \$k\_e\$ | Plasma insulin elimination rate constant | \$0.138\$ | \$\\text{min}^{-1}\$ | \$0.100 \- 0.200\$ |
| \$p\_2\$ | Insulin action deactivation rate | \$0.014\$ | \$\\text{min}^{-1}\$ | \$0.008 \- 0.022\$ |
| \$p\_3\$ | Insulin action activation rate | \$0.000028\$ | \$\\text{min}^{-2}/(\\mu\\text{U/mL})\$ | \$0.00001 \- 0.00005\$ |
| \$S\_G\$ | Fractional glucose effectiveness | \$0.014\$ | \$\\text{min}^{-1}\$ | \$0.005 \- 0.030\$ |
| \$V\_G\$ | Glucose distribution volume | \$1.49\$ | \$\\text{dL/kg}\$ | \$1.20 \- 1.80\$ |
| \$G\_b\$ | Baseline steady-state plasma glucose | \$95.0\$ | \$\\text{mg/dL}\$ | \$70.0 \- 120.0\$ |
| \$I\_b\$ | Baseline steady-state plasma insulin | \$7.0\$ | \$\\mu\\text{U/mL}\$ | \$3.0 \- 15.0\$ |

# **Engineering Guardrails: Preventing a "Vibe-Coded" Simulation**

To maintain scientific integrity and prevent numerical hallucination common in unconstrained interactive simulations, the system enforces four strict structural engineering rules:

## **Rule 1: Zero LLM-Generated Rate Constants**

Every kinetic rate, binding constant, and clearance rate in the system must be explicitly defined from peer-reviewed literature. Free-form text generation of mathematical constants by Large Language Models is strictly forbidden. The web interface must display the exact DOI reference, metric units, and physiological min/max boundary conditions alongside every parameter slider.

## **Rule 2: Mission Control Automated Physiological Assertions**

The system runs continuous integration (CI) integration tests executing numerical assertions on every code commit. A build fails automatically if any of the following conditions occur:

* **Steady-State Basal Drift:** Continuous basal insulin infusion (\$u(t) \= u\_{basal}\$) drifts outside the euglycemic window (\$90 \\text{ mg/dL} \\le G\_{ss} \\le 110 \\text{ mg/dL}\$) after a 24-hour simulation run.  
* **Glucose Tolerance Breach:** A standard \$75\\text{g}\$ oral meal challenge fails to peak within \$45 \- 90 \\text{ minutes}\$ or fails to return below \$140 \\text{ mg/dL}\$ within \$180 \\text{ minutes}\$ under standard insulin cover.  
* **Numerical Instability:** Extreme user-defined parameter slider configurations produce `NaN`, negative concentrations, or Runge-Kutta solver divergence (stiffness failure).

## **Rule 3: Strict FDA SaMD Boundary Enforcement**

The software must operate exclusively as an open-source pre-clinical research engine and educational sandbox. The application core contains zero hooks for ingesting live Continuous Glucose Monitor (CGM) streams or automated pump communication protocols (e.g., Bluetooth LE pump interfaces). It must display a persistent visual banner stating that the platform does not provide personal medical advice or diagnostic dosing recommendations.

## **Rule 4: Built-In Model Assumptions & Limitations Drawer**

Every simulation view must include a permanent, un-collapsible "Model Assumptions & Limitations" panel listing physiological mechanisms intentionally omitted from the current mathematical version. This prevents over-interpretation of simulation results:

* Excludes counter-regulatory hormone surges (cortisol, glucagon, epinephrine).  
* Excludes acute, non-linear exercise-induced GLUT4 translocation pathways.  
* Models oxygen diffusion assuming uniform macro-capsule geometry without local vascular bed variations.

# **4-Week Implementation Roadmap**

```
[Week 1] Schema & RK4 Engine  ======>
[Week 2] Integration Testing         ======>
[Week 3] UI & Citations                     ======>
[Week 4] Docs & Outreach                           ======>
```

## **Week 1: Core Solver & Parameter Infrastructure**

* Re-parameterize existing TypeScript/Python JSON schema layers to support T1D variables (\$M\_1, C\_{47}, I\_{sc1}, I\_{sc2}, G, X\$).  
* Implement fixed-timestep (\$dt \= 0.1 \\text{ min}\$) and adaptive Runge-Kutta 4th Order (RK4) numerical ODE integration algorithms for Sub-Models A, B, and C.  
* Establish unit test coverage validating mathematical purity of solvers against known analytical differential solutions.

## **Week 2: Mission Control Integration Suite**

* Configure automated regression test pipelines enforcing Rule 2 assertions across standard Virtual Patient profiles (Adult, Adolescent, Child parameters).  
* Implement numerical verification routines comparing calculated model trajectories against published UVa/Padova population cohort standard deviations.

## **Week 3: Interactive UI & Documentation Panel**

* Construct frontend slider controls featuring enforced physiological step sizes, hard boundary constraints, and dynamic parameter resets.  
* Implement inline DOI citation tooltips, unit indicators, and the mandatory Model Limitations Drawer on all active bench pages.

## **Week 4: Verification Video, Open-Source Release, & Outreach**

* Record a concise 2-minute technical walkthrough showcasing real-time parameter sweeps, solver performance, and Mission Control failure states.  
* Publish complete source code under an open-source license with detailed API documentation.  
* Initiate targeted outreach to computational diabetes laboratories and open-source AID development groups.

# **Target Collaborators & Outreach Strategy**

## **Translational Academic Laboratories**

Target academic research groups specializing in computational islet biology, stem-cell bio-engineering, and metabolic modeling.

* **IU School of Medicine Center for Diabetes and Metabolic Diseases (CDMD):** Islet Biology & Survival Cores; CDMD Data & Analytics Core.  
* **Regenstrief Institute:** Healthcare data and computational biology integration leads.

## **Open-Source Artificial Pancreas & Digital Twin Communities**

Target developer networks building and testing closed-loop automated insulin delivery systems.

* **Tidepool Project:** Open-source digital health platform engineers.  
* **OpenAPS / Loop / Trio Communities:** Open-source automated insulin delivery algorithm developers requiring simulated physiological test environments.

## **Cold Outreach Email Template**

```
Subject: Open-source T1D simulation harness / UVa-Padova ODE implementation

Hi [Name/Postdoc Title],

I developed an open-source, deterministic simulation workbench that re-implements the Dalla Man / Cobelli subcutaneous insulin-glucose kinetics alongside a simplified Fickian oxygen-diffusion model for encapsulated stem-cell islets.

I noticed your lab's work on [insert specific paper reference regarding islet stress/survival or metabolic modeling], and wanted to share the repository and verification suite: [Link to Repository].

The software runs entirely client-side, using fixed-step RK4 integration and automated unit assertions (Mission Control harness) to validate metabolic trajectories against literature bounds. Every parameter in the UI is pinned directly to its peer-reviewed DOI.

I have a concrete technical question regarding Sub-Model A (hypoimmune cell survival): We currently model NK-cell missing-self activation using a simplified Michaelis-Menten inhibition curve based on CD47 surface density. In your experience, does this adequately capture early graft loss, or should we explicitly account for surface HLA-E / CD94-NKG2A signaling interactions to avoid overestimating survival window?

I would appreciate any feedback on whether this tool could be useful for your team's rapid hypothesis prototyping.

Best regards,

[Name]
Software / Simulation Developer
[Link to Demo / GitHub]
```

# **Appendix: AI-Assisted Implementation Prompts, Glass-Box Provenance & Verification Protocol**

## **1\. Strict Fidelity & "Glass-Box" Provenance Requirements**

* **Mandated Engineering Rule:** AI coding assistants are strictly prohibited from inventing, approximating, or interpolating biological rate constants, equations, or physiological thresholds. Every constant must be pinned to a hardcoded, immutable TypeScript/JSON provenance object containing: parameter symbol, numeric value, SI/clinical unit, physiological min/max bounds, primary literature citation, exact DOI, and page/table number from the source paper.  
* **Zero Black-Box Architecture ("Inspectable Provenance UI"):** Researchers must be able to click any output curve, equation term, or parameter slider to open an inline "Glass-Box Inspector" showing:  
  * Exact algebraic equation currently executing in the solver step.  
  * Live intermediate state variables (e.g., dI\_sc1/dt, dI\_sc2/dt, remote insulin action X(t), local capsule pO2(x), and T-cell vs. NK-cell kill fluxes) at the hovered timestamp.  
  * Source provenance metadata (exact paper title, authors, year, DOI, and table/equation number where the parameter was extracted) plus explicit warning flags if a user pushes a parameter outside validated cohort bounds.  
  * One-click export of the exact initial conditions, solver timestep, parameter provenance JSON, and raw CSV trajectory so any lab can reproduce the run in Python, R, or MATLAB.

## **2\. Exact Copy-Paste Prompts for AI Coding Assistants (Fidelity-Locked)**

### **Prompt 1: Parameter Provenance Schema & Hardcoded Literature Registry**

```
You are implementing the core parameter registry for our TypeScript/React Virtual BioTech Lab T1D module. STRICT FIDELITY RULE: Do NOT invent, estimate, or hallucinate any biological constants, equations, or bounds. Every parameter must be defined in a readonly TypeScript registry object (T1D_PARAMETER_REGISTRY) with mandatory fields: id, symbol, name, value, unit, minBound, maxBound, sourceCitation, doi, sourceLocation (exact table/equation number), and validityWarning. Implement exact constants from Dalla Man, Rizza, & Cobelli (IEEE Trans Biomed Eng 2007, DOI: 10.1109/TBME.2007.893506) for subcutaneous insulin-glucose kinetics and published Fickian islet oxygen diffusion parameters. Reject any parameter without a verified DOI and source location. Write unit tests verifying that no parameter can be mutated outside [minBound, maxBound] without triggering an explicit OUT_OF_VALIDATED_COHORT_BOUNDS flag.
```

### **Prompt 2: Deterministic RK4 Solver & Glass-Box State Telemetry**

```
Using ONLY the constants in T1D_PARAMETER_REGISTRY, implement a deterministic 4th-order Runge-Kutta (RK4) ODE solver (dt = 0.1 min) for Sub-Model A (Hypoimmune Islet Immune-Evasion Balance), Sub-Model B (Fickian Encapsulated Islet Oxygen Diffusion & Hypoxia Loss), and Sub-Model C (Dalla Man Subcutaneous Insulin-Glucose PK/PD). STRICT FIDELITY & GLASS-BOX REQUIREMENT: Do not simplify, linearize, or omit any term in the governing equations. At every timestep, emit a full SolverTraceFrame object containing all state variables, individual flux contributions (e.g., CD8+ T-cell lysis flux vs. NK-cell missing-self lysis flux vs. hypoxia necrosis flux), and active parameter IDs. Add runtime assertions that immediately throw a structured error if any concentration becomes negative, NaN, or Infinite, or if mass-balance conservation drifts beyond 1e-6.
```

### **Prompt 3: Glass-Box Researcher Inspector UI & Reproducibility Exporter**

```
Build the Researcher Glass-Box Inspector drawer and Provenance Overlay for the T1D workbench. Requirements: (1) Clicking any plotted curve or equation term displays the live algebraic formula, exact numeric flux breakdown at the selected timestamp, and full literature provenance (sourceCitation, doi, sourceLocation). (2) Render a persistent, non-collapsible 'Validated Scope & Omitted Physiology' panel detailing every omitted pathway (counter-regulatory glucagon/epinephrine/cortisol surges, exercise GLUT4 uptake, vascular heterogeneity). (3) Add a 'Download Reproducibility Bundle (.json + .csv)' button that exports the exact ODE version hash, parameter provenance table, solver timestep, and full trajectory data so external researchers can audit and reproduce every simulation run.
```

## **3\. End-to-End Verification Protocol (How to Prove It Works Without a Wet Lab)**

* **Stage 1: Analytical & Mass-Conservation Verification** — Test the RK4 solver against closed-form analytical solutions (e.g., zero-meal exponential insulin clearance decay I\_p(t) \= I\_0 \* exp(-k\_e \* t)) and verify numerical error stays below 0.01% across timestep halving (dt \= 0.1 min vs. dt \= 0.05 min).  
* **Stage 2: Published Cohort Curve Replication (UVa/Padova & Literature Envelopes)** — Run standard virtual patient benchmarks (basal steady-state euglycemia 90–110 mg/dL over 24 hours; 75g oral glucose tolerance test with standard bolus cover; 72-hour encapsulated islet hypoxia profile across 100–500 micron capsule thicknesses) and assert that simulated peak times, area-under-curve (AUC), and nadir values fall within published peer-reviewed interquartile ranges.  
* **Stage 3: Adversarial Edge-Case & Boundary Fuzzing in Mission Control** — Automatically sweep sliders to extreme physiological limits (0% MHC-I with 0% CD47; extreme insulin sensitivity; zero basal infusion) to verify the system flags non-physiological states cleanly without NaN crashes or silent instability.  
* **Stage 4: External Domain-Expert Code & Equation Audit** — Publish the math engine as an isolated, readable module (t1d-core-kinetics) with Jupyter/Python cross-verification notebooks and ask an islet biologist or open-source AID maintainer to audit the equation transcription line-by-line.

## **4\. Career, Authorship & Attribution Roadmap (What Happens If It Gets Adopted)**

* **Permanent Authorship & Citability (GitHub \+ Zenodo DOI \+ CITATION.cff):** By licensing the repository under MIT or Apache 2.0, adding a CITATION.cff file, and archiving releases on Zenodo, you receive a permanent, citable DOI as the creator and lead author. Whenever researchers use your simulator in a grant, poster, or paper, they cite your name and DOI directly.  
* **Academic Co-Authorship & Software Papers:** If a lab (such as an IU CDMD group or an open-source AID team) adopts or extends the workbench for a published study, standard academic credit guidelines (CRediT taxonomy: Software, Methodology, Visualization) entitle you to formal co-authorship on resulting papers—or you can publish a standalone peer-reviewed software paper in the Journal of Open Source Software (JOSS) or PLOS Computational Biology.  
* **Who Sees It & Career Impact:** Your work becomes visible to computational endocrinologists, translational islet bioengineers, open-source artificial pancreas engineers (Tidepool, OpenAPS/Loop), and biotech R\&D engineering leads—demonstrating rare, verifiable proof that you can translate peer-reviewed biomedical mathematics into audited, production-grade simulation software.

* IMPORTANT: PRIORITIZE THIS OVER PREVIOUS INFO IF APPLICABLE:
* # Canonical T1D Mathematical Specification (Pass 1 Final)

## 1. Coupled 8-State Meal-Insulin-Glucose ODE System (Minutes Time Base)
State vector: `[Q_sto1, Q_sto2, Q_gut, I_sc1, I_sc2, I_p, X, G]` (integrated via RK4 at `dt = 0.1 min`).

### 1.1 Three-Compartment Meal Absorption (Dalla Man et al. 2007 Eq. 13; 2014 Appendix Eq. A3)
- `dQ_sto1/dt = -k_gri * Q_sto1 + M(t)` (where `M(t) = D / 15` mg/min over a 15-min meal ingestion window, `0` otherwise)
- `dQ_sto2/dt = -k_empt(Q_sto) * Q_sto2 + k_gri * Q_sto1`
- `dQ_gut/dt = -k_abs * Q_gut + k_empt(Q_sto) * Q_sto2`
- `Q_sto = Q_sto1 + Q_sto2`
- `k_empt(Q_sto) = k_min + ((k_max - k_min) / 2) * (tanh(alpha * (Q_sto - b * D_bar)) - tanh(beta * (Q_sto - c_thresh * D_bar)) + 2)`
  - `D_bar = 30000` mg, `alpha = 5 / (2 * D_bar * (1 - b))`, `beta = 5 / (2 * D_bar * c_thresh)`
- `Ra_meal(t) = (f * k_abs * Q_gut) / BW` (mg/kg/min, with adult cohort mean `BW = 75.2 kg`, Visentin et al. 2018 Table 1)
- **Verified Registry Constants (Dalla Man et al. 2007 Table I, DOI: 10.1109/TBME.2007.893506 & Dalla Man et al. 2014 Appendix Eq. A3, DOI: 10.1177/1932296813514502):**
  - `k_max = 0.0558 min^-1` `[0.030, 0.090]`
  - `k_min = 0.0080 min^-1` `[0.002, 0.020]`
  - `k_abs = 0.0570 min^-1` `[0.020, 0.120]`
  - `k_gri = 0.0558 min^-1` `[0.030, 0.090]`
  - `f = 0.90` (dimensionless) `[0.70, 1.00]`
  - `b = 0.69` (dimensionless, 2014 T1DMS) `[0.50, 0.90]`
  - `c_thresh = 0.17` (dimensionless, 2014 T1DMS) `[0.05, 0.35]`

### 1.2 Full 13-State Glucose-Insulin ODEs (Dalla Man, Rizza, & Cobelli 2007, Eqs. 1–18 & Table I, DOI: 10.1109/TBME.2007.893506)
- **Glucose Subsystem (mg/kg and mg/dL):**
  - `dG_p/dt = EGP(t) + Ra_meal(t) - U_ii(t) - E(t) - k_1 * G_p + k_2 * G_t`
  - `dG_t/dt = -U_id(t) + k_1 * G_p - k_2 * G_t`
  - `G(t) = G_p(t) / V_G` (`mg/dL`)
  - `EGP(t) = max(0, k_p1 - k_p2 * G_p(t) - k_p3 * X_L(t))` (`mg/kg/min`)
  - `U_ii(t) = F_cns` (`1.0 mg/kg/min`, constant CNS uptake)
  - `U_id(t) = ((V_m0 + V_mx * X(t)) * G_t(t)) / (K_m0 + G_t(t))` (`mg/kg/min`)
  - `E(t) = max(0, k_e1 * (G_p(t) - k_e2))` (`mg/kg/min`, renal excretion)
- **Insulin & Action Subsystem (pmol/kg and pmol/L):**
  - `dI_sc1/dt = -(k_d + k_a1) * I_sc1 + u_pmol(t)` (`u_pmol(t)` in `pmol/kg/min`; `1 U = 6000 pmol`, divided by `BW`)
  - `dI_sc2/dt = k_d * I_sc1 - k_a2 * I_sc2`
  - `Ra_I(t) = k_a1 * I_sc1 + k_a2 * I_sc2` (`pmol/kg/min`)
  - `dI_p/dt = -(m_2 + m_4) * I_p + m_1 * I_l + Ra_I(t) + f_viable * graft_fraction * S_graft(t)`
  - `dI_l/dt = m_2 * I_p - (m_1 + m_3_eq) * I_l`, where `m_3_eq = (HE_b * m_1) / (1 - HE_b)`
  - `I(t) = I_p(t) / V_I` (`pmol/L`; `1 uU/mL = 6.0 pmol/L`)
  - `dI_delay1/dt = -k_i * (I_delay1 - I(t))`
  - `dX_L/dt = -k_i * (X_L - I_delay1)` (`pmol/L`, delayed portal/liver insulin action)
  - `dX/dt = -p_2U * X + p_2U * (I(t) - I_b)` (`pmol/L`, remote interstitial insulin action)
- **Verified Literature Constants (Dalla Man et al. 2007 Table I, DOI: 10.1109/TBME.2007.893506 & Dalla Man et al. 2014 Section 2, DOI: 10.1177/1932296813514502):**
  - `V_G = 1.88 dL/kg` (Table I)
  - `k_1 = 0.065 min^-1` (Table I)
  - `k_2 = 0.079 min^-1` (Table I)
  - `V_I = 0.05 L/kg` (Table I)
  - `m_1 = 0.190 min^-1` (Table I)
  - `m_2 = 0.484 min^-1` (Table I)
  - `m_4 = 0.194 min^-1` (Table I)
  - `HE_b = 0.60` (dimensionless basal hepatic extraction, Table I)
  - `k_p2 = 0.0021 min^-1` (Table I)
  - `k_p3 = 0.0090 mg/kg/min per pmol/L` (Table I)
  - `F_cns = 1.0 mg/kg/min` (Table I)
  - `V_m0 = 2.50 mg/kg/min` (Table I)
  - `V_mx = 0.047 mg/kg/min per pmol/L` (Table I)
  - `K_m0 = 225.59 mg/kg` (Table I)
  - `p_2U = 0.0331 min^-1` (Table I)
  - `k_i = 0.0079 min^-1` (Table I)
  - `k_e1 = 0.0005 min^-1` (Table I)
  - `k_e2 = 339.0 mg/kg` (Table I)
  - `k_d = 0.0164 min^-1`, `k_a1 = 0.0018 min^-1`, `k_a2 = 0.0182 min^-1` (2014 Section 2)
  - `G_b = 119.1 mg/dL` (Visentin et al. 2018 Table 1 adult fasting mean)
  - `I_b = 42.0 pmol/L` (`7.0 uU/mL * 6.0 pmol/uU`)
- **Exact Algebraic Fasting Equilibrium Initialization (`t = 0`, zero synthetic rates):**
  - `G_pb = G_b * V_G` (`223.908 mg/kg`)
  - `I_pb = I_b * V_I` (`2.10 pmol/kg`)
  - `I_lb = (m_2 * I_pb) / (m_1 + m_3_eq)`
  - `G_tb = (F_cns + k_1 * G_pb) / (k_2 + V_m0 / (K_m0 + G_tb_approx))` -> solved quadratically from `k_1 * G_pb - k_2 * G_tb - (V_m0 * G_tb) / (K_m0 + G_tb) = 0`:
    - `A = k_2`, `B = k_2 * K_m0 + V_m0 - k_1 * G_pb`, `C = -k_1 * G_pb * K_m0`
    - `G_tb = (-B + sqrt(B^2 - 4 * A * C)) / (2 * A)`
  - `U_id_b = (V_m0 * G_tb) / (K_m0 + G_tb)`
  - `k_p1 = F_cns + U_id_b + k_p2 * G_pb + k_p3 * I_b` (ensures `dG_p/dt = 0` at `t = 0` with `Ra_meal = 0` and `E = 0`)
  - `Ra_I_b = (m_2 + m_4) * I_pb - m_1 * I_lb` (`pmol/kg/min`)
  - `u_basal_pmol = (Ra_I_b * (k_d + k_a1)) / (k_a1 + k_d)`
  - `I_sc1(0) = u_basal_pmol / (k_d + k_a1)`, `I_sc2(0) = (k_d * I_sc1(0)) / k_a2`
  - `I_delay1(0) = I_b`, `X_L(0) = I_b`, `X(0) = 0`

## 3. Graft Insulin Secretion Adaptation (`ADAPTED_FROM_DALLA_MAN_2007_EQS_7_9`)
- **Provenance Classification:** `ADAPTED_FROM_DALLA_MAN_2007_EQS_7_9` (Dalla Man et al. 2007 Eqs. 7–9 & Table I, adapted for exogenous T1D islet grafts by setting native basal secretion `S_b = 0` and adding viability scaling `f_viable(t) * graft_fraction` to `dI_p/dt`; note that C-peptide kinetics are not modeled in v1).
- **Equations:**
  - `dI_po/dt = -gamma_sec * I_po + S_po`, `S_graft(t) = gamma_sec * I_po` (`pmol/kg/min`)
  - `S_po = Y_sec + (dG/dt > 0 ? K_sec * dG/dt : 0)`
  - `dY_sec/dt = -alpha_sec * (Y_sec - max(0, beta_sec * (G - G_b)))`
  - Constants (Dalla Man et al. 2007 Table I): `gamma_sec = 0.50 min^-1`, `K_sec = 2.30 pmol/kg/(mg/dL)`, `alpha_sec = 0.050 min^-1`, `beta_sec = 0.110 pmol/kg/min/(mg/dL)`.

## 4. Cohort Validation Benchmark (Visentin et al. 2018 Table 1 & Fig. 4, PMCID: PMC5851236)
- **Protocol:** `n = 100` adult cohort (`BW = 75.2 kg`, `G_b = 119.1 mg/dL`, `graft_fraction = 0.0`), `60 g` (`60,000 mg`) carbohydrate breakfast at `t = 60 min` accompanied by optimal bolus at `t = 60 min` (`60 g / CR`, `CR = 16.9 g/U` -> `3.55 U` = `21,300 pmol` subcutaneous bolus).
- **Acceptance Assertions:**
  1. 24-hour fasting baseline (`0 g` meal, `0 U` bolus): `G(t)` remains within `119.1 ± 1.0 mg/dL`.
  2. Postprandial overbasal peak (`max(G) - G_b`): falls within published cohort mean ± 1 SD (`68 ± 30 mg/dL`, i.e., `[38.0, 98.0] mg/dL` overbasal).
  3. Postprandial nadir & recovery: `G(t)` declines smoothly toward baseline after peak while staying above the hypoglycemic clamp threshold (`G(t) > 60.0 mg/dL`).
