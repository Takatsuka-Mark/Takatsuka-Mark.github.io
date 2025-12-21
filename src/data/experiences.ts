export interface Experience {
    company: string;
    title: string;
    date: string;
    // Optional details for specific rendering or extra info
    details?: string[];
    isEducation?: boolean; // To distinguish RIT from jobs if needed, or we can just treat them as "entries"
    link?: string;
}

export const experiences: Experience[] = [
    {
        company: 'Cognitiv',
        title: 'Software Engineer',
        date: 'Nov. 2023 - Current',
        details: [
            'placeholder'
        ],
        link: 'https://cognitiv.ai'
    },
    {
        company: 'IBM',
        title: 'DevOps - Software Engineer',
        date: 'Mar. 2022 - Sept 2023',
        details: [
            'placeholder'
        ],
        link: 'https://www.ibm.com'
    },
    {
        company: 'IBM',
        title: 'DevOps Intern',
        date: 'May. 2021 - Aug. 2021',
        details: [
            'placeholder'
        ],
        link: 'https://www.ibm.com'
    },
    {
        company: 'SecureCloudDB',
        title: 'Software Engineering Intern',
        date: 'May. 2020 - Dec. 2020',
        details: [
            'placeholder'
        ],
        link: 'https://www.secureclouddb.com'
    },
];

export const education: Experience[] = [
    {
        company: 'Rochester Institute of Technology (RIT)',
        title: 'B.S. in Computer Science',
        date: 'Aug. 2018 - Dec. 2021',
        details: [
            'Minor in Mathematics',
            'GPA: 3.90'
        ],
        isEducation: true
    }
];
