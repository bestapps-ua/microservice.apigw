module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testRunner: 'jest-jasmine2',
    transform: {
        '^.+\\.(ts|tsx)?$': ['ts-jest', {diagnostics: false}],
    }
};
