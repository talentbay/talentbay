interface User {
    email: string;
}

interface Profile extends User{
    firstName: string;
    lastName: string;
}