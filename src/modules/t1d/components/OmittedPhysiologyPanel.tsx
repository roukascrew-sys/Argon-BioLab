export function OmittedPhysiologyPanel(): HTMLElement {
  const panel=document.createElement('section');panel.className='card';
  panel.innerHTML=`<h2>Scope &amp; omitted physiology</h2><p><strong>Pre-clinical research and educational simulation only. Not clinical decision support.</strong></p><p>Excludes counter-regulatory glucagon, epinephrine and cortisol surges; exercise-induced GLUT4 uptake; C-peptide kinetics; and intraday insulin sensitivity variation.</p><p>The immune rejection rate and maximum hypoxia loss rate are model assumptions. Graft insulin secretion is adapted from Dalla Man 2007 and is not a validated graft model. The oxygen profile is a one-dimensional slab. The 119.34 mg/dL peak is a regression target, not a published cohort result.</p>`;
  return panel;
}
