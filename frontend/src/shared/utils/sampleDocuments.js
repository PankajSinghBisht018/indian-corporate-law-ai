export const getSampleDocuments = () => {
  return [
    {
      id: 'sample-1',
      name: 'IT Master Services Agreement (MSA)',
      type: 'pdf',
      size: '452 KB',
      uploadedAt: new Date('2025-01-15'),
      path: '/Case_Law_Analysis_Template.pdf',
      isSample: true,
      description: 'Comprehensive enterprise IT outsourcing, software engineering deliverables & SLA framework'
    },
    {
      id: 'sample-2',
      name: 'IT & DPDP Act Compliance Checklist',
      type: 'pdf',
      size: '328 KB',
      uploadedAt: new Date('2025-01-10'),
      path: '/Compliance_Checklist.pdf',
      isSample: true,
      description: 'Digital Personal Data Protection Act 2023 & CERT-In cyber directive checklist for IT departments'
    },
    {
      id: 'sample-3',
      name: 'SaaS Agreement & SLA Review Guidelines',
      type: 'pdf',
      size: '567 KB',
      uploadedAt: new Date('2025-01-20'),
      path: '/Contract_Review_Guidelines.pdf',
      isSample: true,
      description: 'Standard guidelines for reviewing 99.9% uptime guarantees, latency caps, and data breach liability'
    },
    {
      id: 'sample-4',
      name: 'IT Employee NDA & Invention Assignment',
      type: 'pdf',
      size: '421 KB',
      uploadedAt: new Date('2025-01-12'),
      path: '/Employment_Law_Guide.pdf',
      isSample: true,
      description: 'Protection of proprietary source code, algorithms, repositories, and moonlighting restrictions'
    },
    {
      id: 'sample-5',
      name: 'Software License & Open Source Governance',
      type: 'pdf',
      size: '634 KB',
      uploadedAt: new Date('2025-01-18'),
      path: '/Intellectual_Property_Rights.pdf',
      isSample: true,
      description: 'Enterprise software licensing, GPL copyleft contamination mitigation & commercial IP rights'
    },
  ]
}

export const getSampleDocumentContent = async (path) => {
  try {
    const response = await fetch(path)
    const blob = await response.blob()
    return URL.createObjectURL(blob)
  } catch (error) {
    console.error('Error loading sample document:', error)
    return null
  }
}
