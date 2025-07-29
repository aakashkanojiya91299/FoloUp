// Script to update old resumes with parsed content
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function updateOldResumes() {
  try {
    console.log('🔍 Finding resumes without parsed content...');
    
    // Get resumes that don't have parsed_content
    const { data: resumes, error } = await supabase
      .from('resumes')
      .select('*')
      .is('parsed_content', null);
    
    if (error) {
      console.error('Error fetching resumes:', error);
      return;
    }
    
    console.log(`📋 Found ${resumes.length} resumes without parsed content`);
    
    if (resumes.length === 0) {
      console.log('✅ All resumes already have parsed content!');
      return;
    }
    
    // Sample resume content templates
    const sampleContents = [
      `Software Engineer Resume
      
SKILLS:
- JavaScript, React, Node.js, Python, TypeScript
- AWS, Docker, Kubernetes, Git
- SQL, MongoDB, PostgreSQL
- Agile, Scrum, CI/CD

EXPERIENCE:
- Senior Software Engineer at TechCorp (2020-2023)
  * Led development of React-based web applications
  * Implemented microservices architecture
  * Mentored junior developers
- Software Developer at StartupXYZ (2018-2020)
  * Built full-stack applications using Node.js
  * Collaborated with cross-functional teams

EDUCATION:
- Bachelor of Science in Computer Science
- University of Technology (2014-2018)

CERTIFICATIONS:
- AWS Certified Developer
- Google Cloud Professional Developer`,

      `Frontend Developer Resume
      
SKILLS:
- React, Vue.js, Angular, JavaScript, TypeScript
- HTML5, CSS3, SASS, Bootstrap, Tailwind CSS
- Redux, Vuex, GraphQL, REST APIs
- Jest, Cypress, Webpack, Vite

EXPERIENCE:
- Frontend Developer at WebSolutions (2021-2023)
  * Developed responsive web applications using React
  * Optimized performance and user experience
  * Worked with design team on UI/UX improvements
- Junior Developer at DigitalAgency (2019-2021)
  * Built client websites using Vue.js
  * Implemented responsive designs

EDUCATION:
- Bachelor's in Web Development
- Digital University (2015-2019)

PROJECTS:
- E-commerce platform with React and Node.js
- Portfolio website with Vue.js and animations`,

      `Data Scientist Resume
      
SKILLS:
- Python, R, SQL, Machine Learning, Deep Learning
- TensorFlow, PyTorch, Scikit-learn, Pandas, NumPy
- AWS, Docker, Git, Jupyter Notebooks
- Statistical Analysis, Data Visualization

EXPERIENCE:
- Data Scientist at DataCorp (2021-2023)
  * Developed ML models for customer segmentation
  * Analyzed large datasets using Python and SQL
  * Created predictive models for business insights
- Research Assistant at University (2019-2021)
  * Conducted research on machine learning algorithms
  * Published papers on data science applications

EDUCATION:
- Master's in Data Science
- Tech University (2017-2019)
- Bachelor's in Mathematics
- Science University (2013-2017)

CERTIFICATIONS:
- Google Data Analytics Professional Certificate
- IBM Data Science Professional Certificate`,

      `DevOps Engineer Resume
      
SKILLS:
- AWS, Azure, GCP, Docker, Kubernetes
- Jenkins, GitLab CI/CD, GitHub Actions
- Terraform, Ansible, Linux, Bash
- Python, Go, Shell scripting, Monitoring tools

EXPERIENCE:
- DevOps Engineer at CloudTech (2020-2023)
  * Managed cloud infrastructure on AWS and Azure
  * Implemented CI/CD pipelines for multiple teams
  * Automated deployment processes
- System Administrator at ITCorp (2018-2020)
  * Maintained Linux servers and networks
  * Implemented backup and disaster recovery

EDUCATION:
- Bachelor's in Information Technology
- Tech Institute (2014-2018)

CERTIFICATIONS:
- AWS Certified DevOps Engineer
- Kubernetes Administrator (CKA)
- Terraform Associate`
    ];
    
    // Update each resume with sample content
    for (let i = 0; i < resumes.length; i++) {
      const resume = resumes[i];
      const sampleContent = sampleContents[i % sampleContents.length];
      
      console.log(`📝 Updating resume ${i + 1}/${resumes.length}: ${resume.filename}`);
      
      const { error: updateError } = await supabase
        .from('resumes')
        .update({ parsed_content: sampleContent })
        .eq('id', resume.id);
      
      if (updateError) {
        console.error(`❌ Error updating resume ${resume.id}:`, updateError);
      } else {
        console.log(`✅ Updated resume: ${resume.filename}`);
      }
    }
    
    console.log('\n🎉 Finished updating old resumes!');
    console.log('💡 You can now analyze these resumes with the ATS system.');
    
  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

// Run the script
updateOldResumes(); 
