INSERT INTO Users (username, email, password, role, createdAt, updatedAt) 
VALUES (
    'superuser', 
    'super@user.com', 
    '$2a$12$fNDKTqi0acxITYlO34Ogjub.62McdYqbk9lgMOQHlGVVzywfRNyNq', -- Ini adalah hash untuk 'ulum99'
    'superuser', 
    NOW(),
    NOW()
);