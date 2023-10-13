
// a random value in rhte range -1 to 1
const randomUnit = ()=>{
    const sign = Math.random()>0.5? 1 : -1;
    return sign *Math.random();

}

// generate unit points
const generateUnitPoints_vec4 = (n) => {
    return Array(n).fill(0).map((_,i)=>{
        return [randomUnit(), randomUnit(), 0, 1];
    });
}