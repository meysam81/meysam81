import consts from "@/data/const.js";

const YOE = __CURRENT_YEAR__ - consts.CAREER_START_YEAR;

export var candidateData = {
  name: "Meysam Azad",
  title: "Senior Site Reliability Engineer",
  contact: {
    email: "contact@meysam.io",
    location: "Indonesia (GMT +7)",
    blog: "developer-friendly.blog",
    linkedin: "linkedin.com/in/meysamazad",
    github: "github.com/meysam81",
  },
  badges: [
    "Kubernetes",
    "Docker",
    "Terraform",
    "AWS",
    "Azure",
    "GCP",
    "Go",
    "Python",
    "VictoriaMetrics",
    "Prometheus",
    "GitOps",
    "Linux",
    "Ansible",
  ],
  summary: `Seasoned Site Reliability Engineer with over ${YOE} years of experience in designing and maintaining robust cloud infrastructure for B2B and B2C applications. Expert in Kubernetes orchestration, infrastructure-as-code, and CI/CD automation, with a proven track record of enhancing system reliability and deployment efficiency. Proficient in Go and Python, with deep expertise in IAM & OAuth2 using Ory tools. Passionate about technical blogging and knowledge sharing.`,
  competencies: [
    "Site Reliability Engineering (SRE)",
    "DevOps Practices",
    "Kubernetes Orchestration",
    "Infrastructure as Code (Terraform, Ansible)",
    "CI/CD Automation (GitHub Actions, GitLab CI)",
    "Cloud Platforms (AWS, Azure, GCP, Hetzner)",
    "Programming Languages (Go, Python)",
    "Identity and Access Management (IAM & OAuth2 with Ory Kratos, Oathkeeper, Keto, Hydra)",
    "Monitoring and Observability (Prometheus/VictoriaMetrics, OpenTelemetry)",
    "Security Best Practices",
    "Technical Blogging",
  ],
  experience: [
    {
      role: "Senior Site Reliability Engineer",
      company: "Licenseware",
      location: "Remote, Romania",
      dates: "Jan 2021 - Present",
      achievements: [
        "Migrated infrastructure across AWS, Azure, and GCP with zero downtime.",
        "Deployed all infrastructure as code using Terraform and Ansible, adopting a GitOps approach with FluxCD.",
        "Provisioned and maintained high-availability Kubernetes clusters with zero downtime rollouts.",
        "Delivered monitoring infrastructure using VictoriaMetrics/Prometheus and OpenTelemetry.",
        "Documented infrastructure and implemented developer tools, reducing developer overhead and improving user experience.",
      ],
    },
    {
      role: "Site Reliability Engineer",
      company: "Amer Andish Hooshmand",
      location: "Tehran, Iran",
      dates: "May 2018 - Dec 2020",
      achievements: [
        "Single-handedly managed entire SRE operations including CI/CD, deployments, and monitoring.",
        "Dockerized Python applications and maintained high availability across production systems.",
        "Implemented comprehensive backup strategies and operational monitoring the whole team.",
      ],
    },
    {
      role: "Backend Developer",
      company: "Bisphone Co.",
      location: "Tehran, Iran",
      dates: "Jun 2016 - Apr 2018",
      achievements: [
        "Developed Erlang-based B2C chat application serving thousands of daily users.",
        "Built custom messaging infrastructure from scratch, replacing ejabberd components.",
        "Delivered innovative chat features ahead of industry standards at the time.",
      ],
    },
  ],
  education: [
    {
      degree: "Master of Science in Software Engineering - QUITTED",
      institution: "Amirkabir University of Technology",
      dates: "Sep 2017 - Jun 2019",
    },
    {
      degree: "Bachelor of Science in Information Technology",
      institution: "Higher Educational Complex of Bam",
      dates: "Sep 2013 - Jun 2017",
    },
  ],
  certifications: [
    "Certified Kubernetes Administrator (CKA)",
    "Certified Kubernetes Security Specialist (CKS)",
    "Certified Kubernetes Application Developer (CKAD)",
    "AWS Certified Solutions Architect",
  ],
  publications: [
    "Regular contributor to developer-friendly.blog with 1,500+ monthly readers.",
    'Authored "Ultimate Docker for Cloud Native Applications"',
  ],
};
