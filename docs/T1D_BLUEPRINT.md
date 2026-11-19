# T1D workbench specification

This pre-clinical research and educational sandbox is not clinical decision support. It does not connect to glucose monitors or insulin pumps. The supporting extraction is [T1D_LITERATURE_DATA.md](../T1D_LITERATURE_DATA.md); it is not itself a validated parameter set. The 13-state model below is a single-meal adaptation using normal-subject parameters, not the full UVA/Padova simulator or an individual digital twin.

## States, time and inputs

Time is in minutes. The metabolic state vector is `[Q_sto1, Q_sto2, Q_gut, G_p, G_t, G_s, I_sc1, I_sc2, I_p, I_l, I_delay1, X_L, X]`. Coupled graft runs add `[I_po, Y_sec, f_viable]`. The deterministic reference uses RK4 with `dt = 0.1 min`, a 60 g meal over 15 minutes, and a one-minute bolus at minute 60. Fasting maintains basal insulin unless an explicitly labeled basal-off scenario is selected.

The registry records the source, location, units, provenance type, and bounds when published. A null bound means no range is established, not that the value is physiologically unrestricted. `usageType` distinguishes parameters used in at least one workbench scenario from contextual values; `activeScenarios` indicates which preset actually uses each entry. Cohort minimum and maximum values are observations from that cohort, not universal physiological boundaries. Values labeled `MODEL_ASSUMPTION` are not peer-reviewed estimates or validated calibration results; a DOI for these entries supplies contextual literature only.

## Gastrointestinal absorption

Stomach and gut states are glucose mass in mg; ingestion is mg/min, body weight is kg, and appearance is mg/kg/min. For a single meal:

```
Q_sto = Q_sto1 + Q_sto2
α = 5 / (2 D_ref (1-b)); β = 5 / (2 D_ref c)
k_empt = k_min + (k_max-k_min)/2 * [tanh(α(Q_sto-b D_ref)) - tanh(β(Q_sto-c D_ref)) + 2]
dQ_sto1/dt = -k_gri Q_sto1 + ingestion
dQ_sto2/dt = k_gri Q_sto1 - k_empt Q_sto2
dQ_gut/dt = k_empt Q_sto2 - k_abs Q_gut
Ra_meal = f k_abs Q_gut / BW
```

The workbench uses the specified fixed 30 g reference dose in the emptying expression. This implementation does not include the 2014 multi-meal memory states or its full gastric normalization scheme. Dalla Man et al. (2007), DOI `10.1109/TBME.2007.893506`, Eq. 13 and Table I provide the underlying transit model; the chosen fixed-reference parameterization is a project assumption.

## Glucose, insulin and sensor dynamics

Glucose compartments are mg/kg, `G = G_p/V_G` is mg/dL, insulin compartments are pmol/kg, and `I = I_p/V_I` is pmol/L. Subcutaneous insulin input is pmol/kg/min. The convention used for the reference protocol is 1 U = 6000 pmol; inputs are divided by body weight.

```
EGP = max(0, k_p1 - k_p2 G_p - k_p3 X_L)
U_id = (V_m0 + V_mx X) G_t / (K_m0 + G_t)
E = max(0, k_e1 (G_p - k_e2))
Ra_I = k_a1 I_sc1 + k_a2 I_sc2
m3_eq = HE_b m1 / (1 - HE_b)
dG_p/dt = EGP + Ra_meal - F_cns - E - k1 G_p + k2 G_t
dG_t/dt = -U_id + k1 G_p - k2 G_t
dG_s/dt = (G_p-G_s)/T_d
G_sensor = G_s/V_G
dI_sc1/dt = u - (k_d+k_a1) I_sc1
dI_sc2/dt = k_d I_sc1 - k_a2 I_sc2
dI_p/dt = -(m2+m4) I_p + m1 I_l + Ra_I + f_viable graft_fraction S_graft
dI_l/dt = m2 I_p - (m1+m3_eq) I_l
dI_delay1/dt = -k_i (I_delay1-I)
dX_L/dt = -k_i (X_L-I_delay1)
dX/dt = -p_2U X + p_2U (I-I_b)
```

The steady-state initializer derives `G_tb` from the quadratic for tissue glucose balance, derives `k_p1` from basal glucose balance, and derives the basal infusion from plasma and liver insulin balance. The insulin delay `T_d = 10 min` is from Dalla Man et al. (2007), GIM Table 1, DOI `10.1177/193229680700100303`. The tissue/plasma equations adapt Dalla Man et al. (2007), DOI `10.1109/TBME.2007.893506`, to exogenous subcutaneous T1D inputs. They fix hepatic extraction and omit native secretion and portal-insulin terms; they are not the complete original model.

## Graft and oxygen assumptions

The graft secretion adaptation uses Dalla Man et al. (2007), Eqs. **23–26** and Table I, DOI `10.1109/TBME.2007.893506`. For this model only, native basal secretion is set to zero and viability scales the graft input; this is not an independently validated graft model and C-peptide kinetics are not modeled.

```
S_graft_raw = γ I_po
S_graft_effective = f_viable graft_fraction S_graft_raw
dI_po/dt = -γ I_po + Y_sec + K max(dG/dt, 0)
dY_sec/dt = -α (Y_sec - max(0, β (G-G_b)))
df_viable/dt = -(k_immune+k_hypoxia) f_viable / 1440
```

`k_immune` and `k_hypoxia` are per-day rates and the survival state uses minutes. Immune rejection, hypoxia loss, threshold interpolation, 1-D slab geometry and graft viability-to-secretion scaling are modeling assumptions, not measured individual rates. The oxygen profile solves a quasi-steady reaction-diffusion equation in mol/m³ and m²/s, with a reflecting core and fixed surface. Cell fraction and the surface boundary are fixed during each run; loss of viable cells does not feed back into oxygen consumption. Buchwald (2009), DOI `10.1186/1742-4682-6-5`, supplies the oxygen-consumption model, not the graft-loss rate.

The display conversion is `pO2_mmHg = concentration / 0.001414`, where the coefficient is in `mol/(m³·mmHg)` at 37°C. The rounded `0.001414` is a **model conversion assumption**, inferred from the rounded inlet concentration `0.198 mol/m³` and `140 mmHg` in Fernandez et al. (2022), Table 1, DOI `10.3389/fbioe.2022.884071`; the table describes the Henry conversion at 37°C but does not print this exact decimal. Buchwald reports a separate coefficient at 35°C. Neither estimate supplies a physiological bound.

## Validation and scope limits

The reference parameters pair normal-subject Dalla Man 2007 values with adult cohort mean inputs from Visentin et al. (2018), DOI `10.1177/1932296818757747`, Table 1. A baseline of 119.1 mg/dL remains within ±1 mg/dL over 24 hours in the fasting regression. A 60 g reference meal with a mealtime bolus gives an approximately 119.34 mg/dL over-basal peak in this implementation; this is a numerical regression target **not** a published patient or population benchmark. Meal appearance integrates to approximately 54,000 mg at fraction 0.9. A 10-minute sensor lag, and graft scenarios, are checked separately.

The published 2018 60 g population excursions refer to multivariate virtual subjects, not this scalar mean parameterization. Omitted mechanisms include counter-regulatory glucagon, epinephrine and cortisol surges, exercise-induced GLUT4 uptake, C-peptide kinetics and intraday insulin sensitivity variation. Independent biological validation remains outstanding. Run `node --test` and `npm run typecheck`; Node's TypeScript stripping alone is not type checking.
