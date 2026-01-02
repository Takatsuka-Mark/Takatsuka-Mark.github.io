export interface Experience {
    company: string;
    title: string;
    date: string;
    // Optional details for specific rendering or extra info
    details?: string[];
    isEducation?: boolean; // To distinguish RIT from jobs if needed, or we can just treat them as "entries"
    link?: string;
    startDate?: number; // Year as decimal
    endDate?: number; // Year as decimal
}

export const experiences: Experience[] = [
    {
        company: 'Cognitiv',
        title: 'Software Engineer',
        date: 'Nov. 2023 - Current',
        details: [
            'placeholder'
        ],
        link: 'https://cognitiv.ai',
        startDate: 2023.83, // Nov 2023
        endDate: 2025.99 // Current
    },
    {
        company: 'IBM',
        title: 'DevOps - Software Engineer',
        date: 'Mar. 2022 - Sept 2023',
        details: [
            'placeholder'
        ],
        link: 'https://www.ibm.com',
        startDate: 2022.16, // Mar 2022
        endDate: 2023.75 // Sept 2023
    },
    {
        company: 'IBM',
        title: 'DevOps Intern',
        date: 'May. 2021 - Aug. 2021',
        details: [
            'placeholder'
        ],
        link: 'https://www.ibm.com',
        startDate: 2021.33, // May 2021
        endDate: 2021.66 // Aug 2021
    },
    {
        company: 'SecureCloudDB',
        title: 'Software Engineering Intern',
        date: 'May. 2020 - Dec. 2020',
        details: [
            'placeholder'
        ],
        link: 'https://www.secureclouddb.com',
        startDate: 2020.33, // May 2020
        endDate: 2020.92 // Dec 2020
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
        isEducation: true,
        startDate: 2018.66, // Aug 2018
        endDate: 2021.92 // Dec 2021
    }
];
